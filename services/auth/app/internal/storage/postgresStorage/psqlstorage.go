package postgresstorage

import (
	"auth_service/internal/models"
	"context"
	"database/sql"
	"errors"
	"log/slog"

	_ "github.com/lib/pq"
)

type Postgres struct {
	Logger   *slog.Logger
	Database *sql.DB
}

func NewPostgresDB(log *slog.Logger, dsn string) *sql.DB {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Error("Cannot open database", slog.Any("error", err))
		panic(err)
	}

	if err := db.Ping(); err != nil {
		log.Error("No signal with database", slog.Any("error", err))
		panic(err)
	}

	log.Info("Database connected succesfully")
	return db
}

func NewPostgres(dsn string, logger *slog.Logger) *Postgres {
	db := NewPostgresDB(logger, dsn)
	return &Postgres{Database: db, Logger: logger}
}

// ))))
func (p *Postgres) IsAdmin(ctx context.Context, UID int) bool {
	return false
}

func (p *Postgres) GetUserByEmail(ctx context.Context, email string) (models.User, error) {

	var user models.User
	query := `SELECT uid,email,password FROM users WHERE email = $1`

	row := p.Database.QueryRowContext(ctx, query, email)

	err := row.Scan(&user.UID, &user.Email, &user.HashPass)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.User{}, errors.New("user not found")
		}
		p.Logger.Error("Getting user failed", slog.String("email", email))
		return models.User{}, err
	}

	return user, nil
}

func (p *Postgres) CreateNewUser(ctx context.Context, newUser models.NewUser) error {
	query := `INSERT INTO users (email, password) VALUES ($1, $2)`
	_, err := p.Database.ExecContext(ctx, query, newUser.Email, newUser.HashPass)
	if err != nil {
		p.Logger.Error("Failure while creating user", slog.String("email", newUser.Email), slog.Any("error", err))
		return err
	}
	return nil
}
