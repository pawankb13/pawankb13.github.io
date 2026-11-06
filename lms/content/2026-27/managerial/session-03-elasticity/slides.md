# Elasticity and Its Application

Managerial Economics · Session 3

---

## What elasticity measures

- How strongly quantity demanded responds to a change in price
- **Elastic:** quantity changes by more than price
- **Inelastic:** quantity changes by less than price

---

## The midpoint formula

$$E_d = \frac{(Q_2 - Q_1)/\bar{Q}}{(P_2 - P_1)/\bar{P}}$$

Here $\bar{Q}$ and $\bar{P}$ are the averages of the two points.

---

## Elasticity and total revenue

Move the price. Watch revenue and elasticity change. Demand: Q = 100 − 2P.

<div class="demo">
<div class="demo-controls"><label for="el-price">Price per glass</label><input type="range" id="el-price" min="2" max="48" step="1" value="15"><output id="el-out" for="el-price">₹15</output></div>
<canvas id="el-canvas" width="1000" height="330"></canvas>
<p class="demo-read" id="el-read"></p>
</div>

<script>
(function () {
  var cv = document.getElementById("el-canvas"), ctx = cv.getContext("2d");
  var sl = document.getElementById("el-price"), out = document.getElementById("el-out"), rd = document.getElementById("el-read");
  function tok(n, f) { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || f; }
  function draw() {
    var P = +sl.value, Q = 100 - 2 * P, R = P * Q, E = -2 * P / Q;
    var w = cv.width, h = cv.height, l = 70, r = 30, t = 40, b = 50;
    var X = function (q) { return l + q / 100 * (w - l - r); };
    var Y = function (p) { return h - b - p / 50 * (h - b - t); };
    var ink = tok("--ink", "#222"), muted = tok("--muted", "#666"), acc = tok("--accent-bright", "#52adc8"), soft = tok("--accent-soft", "#e5edf5"), line = tok("--line", "#ddd");
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = soft; ctx.fillRect(X(0), Y(P), X(Q) - X(0), Y(0) - Y(P));
    ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(X(50), Y(0)); ctx.lineTo(X(50), Y(25)); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = muted; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X(0), Y(50)); ctx.lineTo(X(0), Y(0)); ctx.lineTo(X(100), Y(0)); ctx.stroke();
    ctx.strokeStyle = ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(X(0), Y(50)); ctx.lineTo(X(100), Y(0)); ctx.stroke();
    ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(X(Q), Y(P), 9, 0, 7); ctx.fill();
    ctx.fillStyle = muted; ctx.font = "18px 'Source Sans 3', sans-serif";
    ctx.textAlign = "center"; ctx.fillText("Quantity", X(50), h - 12);
    ctx.fillText("0", X(0), h - b + 22); ctx.fillText("100", X(100), h - b + 22);
    ctx.textAlign = "left"; ctx.fillText("Price", X(0) - 40, 24); ctx.textAlign = "right"; ctx.fillText("50", l - 12, Y(50) + 6);
    ctx.textAlign = "left"; ctx.fillText("Unit elastic at P = 25", X(51), Y(27));
    ctx.fillStyle = acc; ctx.font = "600 20px 'Source Sans 3', sans-serif"; ctx.fillText("Revenue", X(2), Y(P) + 26);
    out.textContent = "₹" + P;
    var kind = Math.abs(E) > 1.001 ? "elastic" : (Math.abs(E) < 0.999 ? "inelastic" : "unit elastic");
    rd.textContent = "Quantity " + Q + "  |  Revenue ₹" + R.toLocaleString("en-IN") + "  |  Elasticity " + E.toFixed(2) + " (" + kind + ")";
  }
  sl.addEventListener("input", draw); window.addEventListener("themechange", draw); draw();
})();
</script>

Note:
Start at ₹15 and raise the price slowly. Ask the class when revenue stops rising. Revenue peaks at ₹25, where elasticity is −1.

---

## Reading the demo

- Below ₹25, demand is inelastic: a price rise **increases** revenue
- At ₹25, elasticity is −1 and revenue is at its peak
- Above ₹25, demand is elastic: a price rise **reduces** revenue

---

## Lemonade Stand simulation

- 14 simulated days, in your assigned group
- Record price, weather, costs, sales and profit each day
- Submit the recording, Excel sheet and presentation on Moodle

Note:
Remind groups: Moodle only, no extensions, all members on camera.
