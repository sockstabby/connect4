import "./App.css";

import Carousel from "./Carousel";

// for the example we are showing characters just to prove it works.
// if you replace the images with valid image urls you just need to change
// SlidingPanel in Carousel.tsx to render an img instead
const images = [
  "https://www.travelandleisure.com/thmb/sH4T0ElWwZFyUhtqAZD3USeiaSc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/james-webb-hole-WEBB0722-a7b14258290d4da9be4c7d50ee732d9b.jpg",
  "https://www.pbs.org/wgbh/nova/media/images/JWST_hero.width-1500.jpg",
  "https://cdn.wccftech.com/wp-content/uploads/2016/09/spacee.jpg",
  "https://d3i6fh83elv35t.cloudfront.net/static/2022/07/STScI-01G7NDA42495H05DYFR9XPZSCA-1-1024x599.png",
];

const App = () => {
  return <Carousel images={["A", "B", "C", "D", "E", "F", "G"]} />;
};
export default App;
