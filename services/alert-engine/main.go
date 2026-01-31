package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Alert struct {
	ID          primitive.ObjectID `bson:"_id"`
	User        primitive.ObjectID `bson:"user"`
	Symbol      string             `bson:"symbol"`
	TargetPrice float64            `bson:"targetPrice"`
	Condition   string             `bson:"condition"`
	IsActive    bool               `bson:"isActive"`
}

type Notification struct {
	Recipient primitive.ObjectID `bson:"recipient"`
	Type      string             `bson:"type"`
	Content   string             `bson:"content"`
	IsRead    bool               `bson:"isRead"`
	CreatedAt time.Time          `bson:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt"`
}

func main() {
	// Load .env
	if err := godotenv.Load("../../server/.env"); err != nil {
		log.Println("Warning: Could not load .env file, checking environment variables")
	}

	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017/stockforumx"
	}

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal("Connection failed:", err)
	}
	defer client.Disconnect(context.Background())

	db := client.Database("stockforumx")
	stocksColl := db.Collection("stocks")
	alertsColl := db.Collection("alerts")
	notifsColl := db.Collection("notifications")

	fmt.Println("Alert Engine started. Watching for price changes...")

	// Watch for changes in the stocks collection
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{
			{Key: "operationType", Value: "update"},
			{Key: "updateDescription.updatedFields.currentPrice", Value: bson.D{{Key: "$exists", Value: true}}},
		}}},
	}
	opts := options.ChangeStream().SetFullDocument(options.UpdateLookup)

	stream, err := stocksColl.Watch(context.Background(), pipeline, opts)
	if err != nil {
		log.Fatal("Watch failed:", err)
	}
	defer stream.Close(context.Background())

	for stream.Next(context.Background()) {
		var event struct {
			FullDocument bson.M `bson:"fullDocument"`
		}
		if err := stream.Decode(&event); err != nil {
			log.Printf("Decode error: %v", err)
			continue
		}

		symbol := event.FullDocument["symbol"].(string)
		currentPrice := event.FullDocument["currentPrice"].(float64)

		fmt.Printf("Price Update: %s @ $%.2f\n", symbol, currentPrice)

		processAlerts(alertsColl, notifsColl, symbol, currentPrice)
	}
}

func processAlerts(alertsColl, notifsColl *mongo.Collection, symbol string, currentPrice float64) {
	// Find active alerts for this symbol
	filter := bson.M{
		"symbol":   symbol,
		"isActive": true,
	}

	cursor, err := alertsColl.Find(context.Background(), filter)
	if err != nil {
		log.Printf("Alert lookup failed for %s: %v", symbol, err)
		return
	}
	defer cursor.Close(context.Background())

	for cursor.Next(context.Background()) {
		var alert Alert
		if err := cursor.Decode(&alert); err != nil {
			log.Printf("Alert decode error: %v", err)
			continue
		}

		shouldTrigger := false
		if alert.Condition == "ABOVE" && currentPrice >= alert.TargetPrice {
			shouldTrigger = true
		} else if alert.Condition == "BELOW" && currentPrice <= alert.TargetPrice {
			shouldTrigger = true
		}

		if shouldTrigger {
			triggerAlert(alertsColl, notifsColl, alert, currentPrice)
		}
	}
}

func triggerAlert(alertsColl, notifsColl *mongo.Collection, alert Alert, currentPrice float64) {
	fmt.Printf("🔥 Alert Triggered! %s: Target $%.2f, Current $%.2f (User: %s)\n", 
		alert.Symbol, alert.TargetPrice, currentPrice, alert.User.Hex())

	// 1. Deactivate alert
	_, err := alertsColl.UpdateOne(
		context.Background(),
		bson.M{"_id": alert.ID},
		bson.M{
			"$set": bson.M{
				"isActive":    false,
				"triggeredAt": time.Now(),
			},
		},
	)
	if err != nil {
		log.Printf("Failed to deactivate alert %s: %v", alert.ID.Hex(), err)
		return
	}

	// 2. Create notification
	content := fmt.Sprintf("Price Alert: %s has hit $%.2f (Target: $%.2f)", 
		alert.Symbol, currentPrice, alert.TargetPrice)
	
	now := time.Now()
	notif := Notification{
		Recipient: alert.User,
		Type:      "PRICE_ALERT",
		Content:   content,
		IsRead:    false,
		CreatedAt: now,
		UpdatedAt: now,
	}

	_, err = notifsColl.InsertOne(context.Background(), notif)
	if err != nil {
		log.Printf("Failed to create notification for user %s: %v", alert.User.Hex(), err)
	}
}
