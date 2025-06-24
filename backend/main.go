package main

import (
	"log"
	"net/http"
	"os"
	"time"

	database "github.com/BlogGFIG/BlogGFIG/dataBase"
	"github.com/BlogGFIG/BlogGFIG/routes"
	"github.com/BlogGFIG/BlogGFIG/utils"
)

func main() {
	// Carrega as badwords em português, inglês e espanhol
	if err := utils.LoadBadwords("pt", "en", "es"); err != nil {
		log.Fatalf("Erro ao carregar badwords: %v", err)
	}

	database.ConnectDB()
	router := routes.HandleRequest()

	// Use a variável de ambiente PORT
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	srv := &http.Server{
		Addr:         "0.0.0.0:" + port,
		Handler:      router,
		WriteTimeout: 10 * time.Second,
		ReadTimeout:  10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	log.Printf("Servidor escutando na porta %s", port)
	log.Fatal(srv.ListenAndServe())
}
