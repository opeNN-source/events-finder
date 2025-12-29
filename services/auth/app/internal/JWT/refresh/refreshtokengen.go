package refresh

import (
	"crypto/rand"
	"encoding/hex"
)

func GenerateRefreshToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
