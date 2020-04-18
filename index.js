
class ElementHandler {
  constructor(variant) {
    this.variant = variant;
  }
  element(element) {
    // An incoming element, such as `div`
    if (element.tagName === "title") {
      element.setInnerContent("Roger\'s Cloudflare App: ${this.variant}");
    }
    else if (element.tagName === "h1" && element.getAttribute("id") === "title") {
      element.append("-- I've been modified with HTMLRewriter");
    }
    else if (element.tagName === "p" && element.getAttribute("id") === "description") {
      if (this.variant === "Variant 1") {
        element.setInnerContent("I do not like green eggs and ham. I do not like them, Sam-I-Am. -Dr. Seuss");
      }
      else {
        element.setInnerContent("I know it is wet and the sun is not sunny, but we can have lots of good fun that is funny. -Dr. Seuss");
      }
    }

    else if (element.tagName === "a" && element.getAttribute("id") === "url") {
      if (this.variant === "Variant 1") {
        element.setInnerContent("My personal website!");
        element.setAttribute("href", "https://rogerji.me");
      }
      else {
        element.setInnerContent("My LinkedIn!");
        element.setAttribute("href", "https://linkedin.com/in/roger-ji");
      }
    }
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
})

async function fetchVariants() {
  try {
    let response = await fetch('https://cfw-takehome.developers.workers.dev/api/variants');
    return response.json();
  }
  catch(err) {
    console.log("Something went hawyire! ", err);
    return null;
  }
}

async function handleRequest(request) {
  var cookies = request.headers.get("my-cookie");
  var variants = await fetchVariants().then((data) => { return data["variants"] }); //array of url variants

  const varOne = variants[0];
  const varTwo = variants[1];
  var whichVariant;

  if (cookies && cookies.includes("variant=v1")) {
    whichVariant = "Variant 1";
  }
  else if (cookies && cookies.includes("variant=v2")) {
    whichVariant = "Variant 2";
  }
  else {
    whichVariant = Math.random() < 0.5 ? "Variant 1" : "Variant 2";
  }

  var response = whichVariant === "Variant 1" ? await fetch(varOne) : await fetch(varTwo); //randomly fetches either variant 1 or variant 2

  if (response.ok) {
    //I tried really hard to get the cookies to work, but for some reason, it's not persisting...

    //I created a new response with an additional key-value in the header for the current variant,
    //and even when I pass that to transform(), it seems that in the next request, it totally "forgets"
    //the cookie it was supposed to store
    var newResponse = new Response(response.body, response)
    if (whichVariant === "Variant 1") {
      newResponse.headers.set('my-cookie', "variant=v1");
    }
    else if (whichVariant === "Variant 2") {
      newResponse.headers.set('my-cookie', "variant=v2");
    }
    return new HTMLRewriter().on('*', new ElementHandler(whichVariant)).transform(newResponse);
  }
  else {
    return new Response("Oof, something went south.")
  }
}
