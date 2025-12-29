package templates

type EventEmailRegistation struct {
	Id          int64
	Name        string
	Description string
	Format      string
	Region      string
	Category    string
	Type        string

	CreateTime string
	StartTime  string
	EndTime    string
}

func NewEventEmailRegistation(
	id int64,
	name,
	desc,
	format,
	region,
	category,
	eventType,
	startTime,
	createTime,
	endTime string,
) EventEmailRegistation {
	return EventEmailRegistation{
		Id:          id,
		Name:        name,
		Description: desc,
		Format:      format,
		Region:      region,
		Category:    category,
		Type:        eventType,
		StartTime:   startTime,
		CreateTime:  createTime,
		EndTime:     endTime,
	}
}
