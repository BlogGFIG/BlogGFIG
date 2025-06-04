package utils

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

var badwordsSet map[string]struct{}

func LoadBadwords(langs ...string) error {
	badwordsSet = make(map[string]struct{})
	for _, lang := range langs {
		path := filepath.Join("badwords", lang)
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			word := strings.TrimSpace(scanner.Text())
			if word != "" {
				badwordsSet[strings.ToLower(word)] = struct{}{}
			}
		}
		if err := scanner.Err(); err != nil {
			return err
		}
	}
	return nil
}

func ContainsBadword(text string) bool {
	words := strings.Fields(strings.ToLower(text))
	for _, w := range words {
		if _, exists := badwordsSet[w]; exists {
			return true
		}
	}
	return false
}
