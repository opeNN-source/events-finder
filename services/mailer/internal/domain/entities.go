package domain

import (
	"time"
)

type Event struct {
	Id          int64
	Name        string
	Description string
	Format      string
	Region      string
	Category    string
	Type        string

	StartTime time.Time
	EndTime   time.Time
}

func NewEvent(
	id int64,
	name,
	desc,
	format,
	region,
	category,
	eventType string,
	startTime,
	endTime time.Time,
) Event {
	return Event{
		Id:          id,
		Name:        name,
		Description: desc,
		Format:      format,
		Region:      region,
		Category:    category,
		Type:        eventType,
		StartTime:   startTime,
		EndTime:     endTime,
	}
}
