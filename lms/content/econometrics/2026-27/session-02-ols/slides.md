# The OLS Estimator

Econometrics · Session 2

---

## The linear model

$$y_i = \beta_0 + \beta_1 x_{1i} + \dots + \beta_k x_{ki} + u_i$$

In matrix form: $y = X\beta + u$

---

## Ordinary least squares

OLS picks $\hat\beta$ to minimise the sum of squared residuals.

$$\hat{\beta} = (X'X)^{-1}X'y$$

---

## Key assumptions

1. Linear in parameters
2. Random sampling
3. No perfect collinearity
4. Zero conditional mean: $E(u \mid X) = 0$
5. Homoskedasticity, for the usual standard errors

---

## In R

```r
model <- lm(log_wage ~ educ + exper, data = wages)
summary(model)
```

|||

**Reading the output**

- Coefficient on `educ`: change in log wage for one more year of schooling
- Multiply by 100 for an approximate percentage effect
