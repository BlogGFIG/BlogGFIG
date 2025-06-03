package main

import (
	"log"
	"net/http"
	"os"

	database "github.com/BlogGFIG/BlogGFIG/dataBase"
	"github.com/BlogGFIG/BlogGFIG/routes"
)

func main() {
	database.ConnectDB()
	router := routes.HandleRequest()

	// Use a variável de ambiente PORT
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("Servidor escutando na porta %s", port)
	log.Fatal(http.ListenAndServe("0.0.0.0:"+port, router))
}
