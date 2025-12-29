package utils

import (
	"fmt"
	"net/mail"
)

func IsValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)

	return err == nil
}

// change to a more flexible formatting
func TemporaryHtmlAndIcsEmail(from, to, subject, htmlBody, icsBody string) []byte {
	return []byte(fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: multipart/mixed; boundary=\"BOUNDARY\"\r\n\r\n"+
			"--BOUNDARY\r\n"+
			"Content-Type: text/html; charset=\"UTF-8\"\r\n\r\n"+
			"%s\r\n"+
			"--BOUNDARY\r\n"+
			"Content-Type: text/calendar; method=REQUEST; charset=\"UTF-8\"\r\n"+
			"Content-Disposition: attachment; filename=\"invite.ics\"\r\n\r\n"+
			"%s\r\n"+
			"--BOUNDARY--",
		from, to, subject, htmlBody, icsBody,
	))
}
