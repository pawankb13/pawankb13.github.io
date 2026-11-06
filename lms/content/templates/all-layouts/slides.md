# Slide Templates

Copy a slide, then change the content

Dr. Pawan Ashok Kamble

---

## How layouts work

- Write a layout line as the **first line** of a slide: `<!-- layout: image-right -->`
- Add options after the name: `<!-- layout: image-full cover -->`
- A slide with no layout line is a plain bullet slide
- Open this file in a text editor, copy the slide you want, and change the text

Note:
Every slide in this deck uses one layout. The text on the slide says which one.

---

## All layouts

|||

| Text | Use |
|---|---|
| (none) | Plain bullets |
| Three bars on one line | Two columns |
| `compare` | Two ideas side by side |
| `callout` | Key idea or definition |
| `quote` | A quotation |
| `stat` | Big numbers |
| `equation` | One large formula |
| `table` | Table, larger text |
| `code` | Code and explanation |

|||

| Flow | Use |
|---|---|
| `steps` | Process in steps |
| `agenda` | Plan for the session |
| `takeaways` | Summary points |
| `activity` | Class exercise |
| `discussion` | Open question |
| `case` | Case study |
| `section` | Section divider |
| `references` | Reading list |
| `end` | Closing slide |

---

<!-- layout: section -->
# Part 1: Text layouts

Ways to set out words and numbers

---

## Plain bullets (default)

No layout line needed.

- Keep each bullet to one idea
- Use four to six bullets at most
- Bold the key term: **price elasticity**

---

## Two columns

|||

**Left column**

- Put `|||` on its own line to split the slide
- Works for text, lists and tables

|||

**Right column**

- Add a third `|||` for three columns
- Put an equation or example here

$$MR = MC$$

---

<!-- layout: compare -->
## Layout: compare

|||

### Perfect competition

- Many sellers
- Price taker
- Zero long-run profit

|||

### Monopoly

- One seller
- Price maker
- Profit can last

---

<!-- layout: callout -->
## Layout: callout

> A rational decision maker compares **marginal benefit** with **marginal cost**.

Use this for a definition, a rule, or the one thing students must remember.

---

<!-- layout: quote -->
> Write the quotation here. Keep it to one or two lines.

Name, Source and year

---

<!-- layout: stat -->
## Layout: stat

|||

# 6.5%

Label for the first number

|||

# 25

Label for the second number

|||

# 7

Label for the third number

---

<!-- layout: equation -->
## Layout: equation

$$MV = PY$$

M is the money supply, V is velocity, P is the price level and Y is real output.

---

<!-- layout: table -->
## Layout: table

| Structure | Sellers | Price power |
|---|---|---|
| Perfect competition | Many | None |
| Monopolistic competition | Many | Some |
| Oligopoly | Few | Large |
| Monopoly | One | Largest |

---

<!-- layout: code -->
## Layout: code

|||

```r
model <- lm(wage ~ educ + exper, data = d)
summary(model)
```

|||

- `lm` fits a linear model
- `summary` prints the coefficients and standard errors

---

<!-- layout: section -->
# Part 2: Session flow

Plans, steps, exercises and summaries

---

<!-- layout: agenda -->
## Layout: agenda

1. Recap of last session
2. New concept: elasticity
3. Worked example
4. Group exercise

---

<!-- layout: steps -->
## Layout: steps

1. **Plan**: set a starting price
2. **Run**: play each day
3. **Record**: fill in the sheet
4. **Review**: find what raised profit

---

<!-- layout: activity -->
## Price a new product

Groups of four. Ten minutes.

1. Choose a product
2. Set a price
3. Predict how sales change if the price rises by 10%

Note:
Walk around the room. Pick two groups to share.

---

<!-- layout: discussion -->
## Should the RBI raise the repo rate?

Think for one minute, then discuss with the person next to you.

---

<!-- layout: case -->
## Case title goes here

**Situation:** Two or three lines that set the scene.

**Question:** The decision students must make.

**Data:** Point to a table or a link.

---

<!-- layout: takeaways -->
## Layout: takeaways

- Elasticity measures how strongly demand responds to price
- Revenue rises with price only when demand is inelastic
- Check both the sign and the size before you act

---

<!-- layout: section -->
# Part 3: Images

Charts, photos and diagrams

---

<!-- layout: image-right -->
## Layout: image-right

- Text on the left, image on the right
- The image is shown whole, never cut
- The words in the brackets become the caption

![Sample chart. Source: add your source here](images/chart-line.svg)

---

<!-- layout: image-left -->
## Layout: image-left

- Image on the left, text on the right
- Good for a chart you then explain point by point

![Sample chart. Source: add your source here](images/chart-bars.svg)

---

<!-- layout: image-full -->
![Sample diagram](images/diagram.svg)

## Layout: image-full

A title band keeps the text readable on any image.

---

<!-- layout: image-full cover -->
![Sample photo](images/photo.svg)

## Layout: image-full cover

Add the word cover to fill the slide. The edges may be trimmed.

---

<!-- layout: image-grid -->
## Layout: image-grid

Use two to four images to compare.

![Before](images/chart-line.svg)
![After](images/chart-bars.svg)

---

<!-- layout: section -->
# Part 4: Interactives and video

HTML files shown inside the slide

---

<!-- layout: interactive -->
## Layout: interactive

Move the sliders. The interactive fills the rest of the slide.

@[IS-LM interactive](interactives/is-lm.html)

---

<!-- layout: interactive-right -->
## Layout: interactive-right

- Short instructions on the left
- The interactive gets most of the width

@[IS-LM interactive](interactives/is-lm.html)

---

<!-- layout: interactive-left -->
## Layout: interactive-left

- The interactive on the left
- Notes and prompts on the right

@[IS-LM interactive](interactives/is-lm.html)

---

## Video

Use the `video` layout with a YouTube embed link.

- First line of the slide: `<!-- layout: video -->`
- Then a title line starting with `##`
- Then the video: `@[Video title](https://www.youtube.com/embed/VIDEO_ID)`

---

<!-- layout: references -->
## Layout: references

- Mankiw, N. G. *Principles of Economics*. Cengage.
- Dornbusch, R., Fischer, S. and Startz, R. *Macroeconomics*. McGraw Hill.

---

<!-- layout: end -->
# Questions?

Dr. Pawan Ashok Kamble · BIMTECH
