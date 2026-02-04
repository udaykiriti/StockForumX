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

// Domain Models
// Alert represents a user's price alert settings
type Alert struct {
	ID          primitive.ObjectID `bson:"_id"`
	User        primitive.ObjectID `bson:"user"`
	Symbol      string             `bson:"symbol"`
	TargetPrice float64            `bson:"targetPrice"`
	Condition   string             `bson:"condition"` // "ABOVE" or "BELOW"
	IsActive    bool               `bson:"isActive"`
}

// Notification represents a message sent to the user
type Notification struct {
	Recipient primitive.ObjectID `bson:"recipient"`
	Type      string             `bson:"type"`
	Content   string             `bson:"content"`
	IsRead    bool               `bson:"isRead"`
	CreatedAt time.Time          `bson:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt"`
}

// Main Function
func main() {
	loadEnvironment()

	// 1. Initialize Database Connection
	client := connectToDatabase()
	defer disconnectDatabase(client)

	db := client.Database("stockforumx")
	stocksColl := db.Collection("stocks")
	alertsColl := db.Collection("alerts")
	notifsColl := db.Collection("notifications")

	fmt.Println("Alert Engine started. Watching for price changes...")

	// 2. Start Watching Real-Time Stream
	watchPriceUpdates(stocksColl, alertsColl, notifsColl)
}

// Database Helpers
func loadEnvironment() {
	if err := godotenv.Load("../../server/.env"); err != nil {
		log.Println("Warning: Could not load .env file, checking environment variables")
	}
}

func connectToDatabase() *mongo.Client {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017/stockforumx"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI).SetMaxPoolSize(50))
	if err != nil {
		log.Fatal("Connection failed:", err)
	}
	return client
}

func disconnectDatabase(client *mongo.Client) {
	if err := client.Disconnect(context.Background()); err != nil {
		log.Printf("Error disconnecting database: %v", err)
	}
}

// Core Logic: Watcher & Processor

func watchPriceUpdates(stocksColl, alertsColl, notifsColl *mongo.Collection) {
	// Define conditions to watch: Only listen for 'update' events where 'currentPrice' changes
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

	// Process event stream
	for stream.Next(context.Background()) {
		var event struct {
			FullDocument bson.M `bson:"fullDocument"`
		}
		if err := stream.Decode(&event); err != nil {
			log.Printf("Decode error: %v", err)
			continue
		}

		symbol, ok := event.FullDocument["symbol"].(string)
		if !ok {
			continue
		}
		
		priceVal, ok := event.FullDocument["currentPrice"].(float64)
		if !ok {
			// Handle case where price might be int or other type in raw BSON
			continue
		}

		fmt.Printf("Price Update: %s @ $%.2f\n", symbol, priceVal)

		// Check if this price change triggers any alerts associated with the stock
		// Run in goroutine to not block the stream watcher
		go checkAndProcessAlerts(alertsColl, notifsColl, symbol, priceVal)
	}
}

func checkAndProcessAlerts(alertsColl, notifsColl *mongo.Collection, symbol string, currentPrice float64) {
	// Find all ACTIVE alerts for this specific stock symbol
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

	// Iterate through matching alerts
	for cursor.Next(context.Background()) {
		var alert Alert
		if err := cursor.Decode(&alert); err != nil {
			log.Printf("Alert decode error: %v", err)
			continue
		}

		// Determine if the alert condition is met
		shouldTrigger := false
		switch alert.Condition {
		case "ABOVE":
			shouldTrigger = currentPrice >= alert.TargetPrice
		case "BELOW":
			shouldTrigger = currentPrice <= alert.TargetPrice
		}

		if shouldTrigger {
			executeAlert(alertsColl, notifsColl, alert, currentPrice)
		}
	}
}

// Alert Execution

func executeAlert(alertsColl, notifsColl *mongo.Collection, alert Alert, currentPrice float64) {
	fmt.Printf("Alert Triggered! %s: Target $%.2f, Current $%.2f (User: %s)\n",
		alert.Symbol, alert.TargetPrice, currentPrice, alert.User.Hex())

	// Step 1: Mark alert as inactive immediately (prevent duplicate triggers)
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

	// Step 2: Send Notification to User
	message := fmt.Sprintf("Price Alert: %s has hit $%.2f (Target: $%.2f)",
		alert.Symbol, currentPrice, alert.TargetPrice)

	now := time.Now()
	notification := Notification{
		Recipient: alert.User,
		Type:      "PRICE_ALERT",
		Content:   message,
		IsRead:    false,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if _, err := notifsColl.InsertOne(context.Background(), notification); err != nil {
		log.Printf("Failed to create notification for user %s: %v", alert.User.Hex(), err)
	}
}
