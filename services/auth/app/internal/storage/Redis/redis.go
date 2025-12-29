package redis

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisStorage struct {
	Redis *redis.Client
}

func (r *RedisStorage) SetSession(ctx context.Context, key string, userID string, ttl time.Duration) error {
	return r.Redis.Set(ctx, key, userID, ttl).Err()
}

func (r *RedisStorage) GetSession(ctx context.Context, token string) (string, error) {
	res, err := r.Redis.Get(ctx, token).Result()
	return res, err
}

func (r *RedisStorage) DeleteSession(ctx context.Context, token string) error {
	return r.Redis.Del(ctx, token).Err()
}

func NewRedisClient(Addr string) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     Addr,
		Password: "",
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		panic("cannot connect to redis: " + err.Error())
	}

	return rdb
}
