# Vision Fieldnotes

A computer vision portfolio with browser-based experiments. [Open the portfolio](https://hracha.github.io/vision-fieldnotes/).

## Class 01 · Image classification

Explore handwritten MNIST digits with a nearest-neighbor classifier, then use the 2D decision map to see how the number of neighbors and the distance metric change the prediction. [Open Class 01](https://hracha.github.io/vision-fieldnotes/classification.html).

## Adding a class

1. Create a class page under `docs/`, using `classification.html` as a layout reference. Give the page a descriptive filename so previously shared class URLs keep working.
2. Add a course card inside the `classes` section of `docs/index.html`. Set its title, class number, description, cover, and links to the lesson and lab. The homepage counts the cards automatically.
3. Put the lab’s public scripts and assets under `docs/` and use relative links. Keep private teaching materials outside the repository.
4. Push the changes to `main`. GitHub Pages publishes the contents of `/docs`.

## Local preview

Run `python -m http.server 8000 --directory docs` from the repository root and open `http://localhost:8000`. The image classification lab loads its two bundled MNIST subsets over HTTP.
