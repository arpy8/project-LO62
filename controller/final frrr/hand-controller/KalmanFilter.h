class KalmanFilter {
private:
    float Q; 
    float R; 
    float P; 
    float X; 
    float K; 

public:
    KalmanFilter(float q = 0.1, float r = 1.0, float p = 1.0, float initial_value = 0) {
        Q = q;
        R = r;
        P = p;
        X = initial_value;
    }

    float update(float measurement) {
        P = P + Q;

        K = P / (P + R);
        X = X + K * (measurement - X);
        P = (1 - K) * P;

        return X;
    }
};