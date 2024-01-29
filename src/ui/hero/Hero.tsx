import Card from "./components/card";

const Hero = () => {
  return (
    <section
      id="hero"
      className="pt-32 lg:mb-20 md:pt-36 lg:pt-25 content-box  max-w-full flex  items-center justify-center  flex-col gap-3 md:gap-12 "
    >
      <div className="lg:w-1/2 w-full">
        <Card />
      </div>
    </section>
  );
};

export default Hero;
