package templates

import (
	"bytes"
	"html/template"
	"log/slog"
	"path/filepath"
	"time"
)

type Renderer struct {
	tpl    *template.Template
	logger *slog.Logger
}

func NewRenderer(path string, logger *slog.Logger) (*Renderer, error) {
	logger.Info("TEMPLATE: initializing renderer", "path", path)

	htmlFiles, err := filepath.Glob(path + "/*.html")
	if err != nil {
		logger.Error(
			"TEMPLATE: failed to parse html files",
			"path", path,
			"error", err,
		)
		return nil, err
	}

	icsFiles, err := filepath.Glob(path + "/*.ics")
	if err != nil {
		logger.Error(
			"TEMPLATE: failed to parse ics files",
			"path", path,
			"error", err,
		)
		return nil, err
	}

	allFiles := append(htmlFiles, icsFiles...)

	tpl := template.New("emails").Funcs(template.FuncMap{
		"formatDateTime": func(t time.Time) string {
			return t.Format("02.01.2006 15:04")
		},
	})

	tpl, err = tpl.ParseFiles(allFiles...)

	if err != nil {
		logger.Error(
			"TEMPLATE: failed to create templates",
			"path", path,
			"error", err,
		)
		return nil, err
	}

	return &Renderer{
		tpl:    tpl,
		logger: logger,
	}, nil
}

func (r *Renderer) Render(name string, data any) (string, error) {
	r.logger.Info("TEMPLATE: rendering template", "name", name)

	var buf bytes.Buffer

	err := r.tpl.ExecuteTemplate(&buf, name, data)
	if err != nil {
		r.logger.Error("TEMPLATE: render failed",
			"name", name,
			"error", err,
		)
		return "", err
	}

	r.logger.Info("TEMPLATE: render success", "name", name, "len", buf.Len())

	return buf.String(), nil
}
