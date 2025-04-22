package main

import (
	database "github.com/BlogGFIG/BlogGFIG/dataBase"
	"github.com/BlogGFIG/BlogGFIG/routes"
)

func main() {
	database.ConnectDB()
	routes.HandleRequest()
}
