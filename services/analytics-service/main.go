package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Models matching MongoDB schemas
type User struct {
	ID      primitive.ObjectID `bson:"_id"`
	Balance float64            `bson:"balance"`
}

type Stock struct {
	ID           primitive.ObjectID `bson:"_id"`
	Symbol       string             `bson:"symbol"`
	CurrentPrice float64            `bson:"currentPrice"`
	Sector       string             `bson:"sector"`
}

type Holding struct {
	ID           primitive.ObjectID `bson:"_id"`
	UserId       primitive.ObjectID `bson:"userId"`
	StockId      primitive.ObjectID `bson:"stockId"`
	Quantity     float64            `bson:"quantity"`
	AveragePrice float64            `bson:"averagePrice"`
}

type PortfolioSnapshot struct {
	UserId        primitive.ObjectID `bson:"userId"`
	TotalValue    float64            `bson:"totalValue"`
	HoldingsValue float64            `bson:"holdingsValue"`
	CashBalance   float64            `bson:"cashBalance"`
	Date          time.Time          `bson:"date"`
	CreatedAt     time.Time          `bson:"createdAt"`
}

type Diversification struct {
	Sector     string  `json:"sector"`
	Value      float64 `json:"value"`
	Percentage float64 `json:"percentage"`
}

func main() {
	if err := godotenv.Load("../../server/.env"); err != nil {
		log.Println("Warning: Could not load .env file")
	}

	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017/stockforumx"
	}

	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.Background())

	db := client.Database("stockforumx")

	// Start Periodic Snapshot Worker (Simulated daily, runs every 5 mins for demo)
	go startSnapshotWorker(db)

	// Expose Analytics API
	http.HandleFunc("/api/analytics/diversification/", func(w http.ResponseWriter, r *http.Request) {
		userIdStr := r.URL.Path[len("/api/analytics/diversification/"):]
		userId, err := primitive.ObjectIDFromHex(userIdStr)
		if err != nil {
			http.Error(w, "Invalid User ID", 400)
			return
		}

		data, err := calculateDiversification(db, userId)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "5001"
	}
	fmt.Printf("Analytics Service running on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func startSnapshotWorker(db *mongo.Database) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	// Run once immediately
	takeSnapshots(db)

	for range ticker.C {
		takeSnapshots(db)
	}
}

func takeSnapshots(db *mongo.Database) {
	fmt.Println("Taking Portfolio Snapshots...")
	
	usersColl := db.Collection("users")
	holdingsColl := db.Collection("holdings")
	stocksColl := db.Collection("stocks")
	snapshotsColl := db.Collection("portfoliosnapshots")

	// Get all stocks for price lookup
	stockMap := make(map[primitive.ObjectID]Stock)
	cursor, _ := stocksColl.Find(context.Background(), bson.M{})
	for cursor.Next(context.Background()) {
		var s Stock
		cursor.Decode(&s)
		stockMap[s.ID] = s
	}

	// Get all users
	uCursor, _ := usersColl.Find(context.Background(), bson.M{})
	defer uCursor.Close(context.Background())

	for uCursor.Next(context.Background()) {
		var user User
		uCursor.Decode(&user)

		// Get all holdings for this user
		hCursor, _ := holdingsColl.Find(context.Background(), bson.M{"userId": user.ID})
		
		holdingsValue := 0.0
		for hCursor.Next(context.Background()) {
			var h Holding
			hCursor.Decode(&h)
			if s, ok := stockMap[h.StockId]; ok {
				holdingsValue += h.Quantity * s.CurrentPrice
			}
		}
		hCursor.Close(context.Background())

		// Save snapshot
		now := time.Now()
		snapshot := PortfolioSnapshot{
			UserId:        user.ID,
			TotalValue:    user.Balance + holdingsValue,
			HoldingsValue: holdingsValue,
			CashBalance:   user.Balance,
			Date:          now,
			CreatedAt:     now,
		}

		_, err := snapshotsColl.InsertOne(context.Background(), snapshot)
		if err != nil {
			log.Printf("Snapshot failed for user %s: %v", user.ID.Hex(), err)
		}
	}
	fmt.Println("Snapshots complete.")
}

func calculateDiversification(db *mongo.Database, userId primitive.ObjectID) ([]Diversification, error) {
	holdingsColl := db.Collection("holdings")
	stocksColl := db.Collection("stocks")

	// Pipeline to join holdings with stocks and group by sector
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{{Key: "userId", Value: userId}}}},
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "stocks"},
			{Key: "localField", Value: "stockId"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "stock"},
		}}},
		{{Key: "$unwind", Value: "$stock"}},
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$stock.sector"},
			{Key: "value", Value: bson.D{{Key: "$sum", Value: bson.D{
				{Key: "$multiply", Value: bson.A{"$quantity", "$stock.currentPrice"}},
			}}}},
		}}},
	}

	cursor, err := holdingsColl.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var results []struct {
		Sector string  `bson:"_id"`
		Value  float64 `bson:"value"`
	}
	
	totalValue := 0.0
	if err = cursor.All(context.Background(), &results); err != nil {
		return nil, err
	}

	for _, r := range results {
		totalValue += r.Value
	}

	var diversification []Diversification
	for _, r := range results {
		percentage := 0.0
		if totalValue > 0 {
			percentage = (r.Value / totalValue) * 100
		}
		diversification = append(diversification, Diversification{
			Sector:     r.Sector,
			Value:      r.Value,
			Percentage: percentage,
		})
	}

	return diversification, nil
}
