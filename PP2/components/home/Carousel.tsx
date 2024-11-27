import { Carousel } from '@mantine/carousel';
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import { useState } from 'react';


interface CardProps {
  name: string;
  role: string;
  content: string;
  index: number;
}


const testimonials = [
  {
    name: "Jane Doe",
    role: "Frontend Developer",
    content: "Scriptorium has transformed my workflow. The code editor is sleek, the syntax highlighting is spot-on, and the ability to run my code instantly is a game-changer. I get more done in less time!"
  },
  {
    name: "John Smith",
    role: "Backend Engineer",
    content: "As a backend engineer, I love how easy it is to test my code in multiple languages without switching between different tools. The isolated environment is perfect for ensuring my code is secure and error-free."
  },
  {
    name: "Alice Johnson",
    role: "Full Stack Developer",
    content: "I’ve been able to save hours by reusing code templates on Scriptorium. It’s easy to fork templates from others, build on them, and share my own creations. It’s like a creative coding playground!"
  },
  {
    name: "Mark Thompson",
    role: "Software Engineer",
    content: "The real-time execution feature is exactly what I need when testing complex algorithms. The instant feedback lets me refine my code quickly, and the platform's performance is stellar."
  },
  {
    name: "Sarah Lee",
    role: "DevOps Engineer",
    content: "I’m all about efficiency, and Scriptorium delivers. The platform's lightweight, fast, and responsive — whether I’m writing code or reading tutorials. Plus, the dark mode is perfect for late-night coding!"
  },
  {
    name: "Robert Brown",
    role: "Senior Developer",
    content: "I've been using many online coding platforms, but Scriptorium stands out for its focus on clean UI, powerful templates, and ease of use. I recommend it to anyone looking to streamline their development process."
  },
  {
    name: "Emily Davis",
    role: "Data Scientist",
    content: "Being able to write, run, and debug my Python code directly in the browser is a lifesaver. Scriptorium is my go-to for quick experiments and sharing code with the team."
  },
  {
    name: "David Williams",
    role: "Mobile App Developer",
    content: "Scriptorium's template system is fantastic. I’ve used it to save snippets I use across multiple apps, and it's saved me countless hours of copying and pasting. It’s an invaluable tool for mobile development!"
  },
  {
    name: "Olivia Martinez",
    role: "Coding Tutor",
    content: "I love that I can create and share coding tutorials with my students. The platform makes it easy for them to run code, see output, and get immediate feedback. It's a great way to teach coding concepts interactively!"
  },
  {
    name: "James Wilson",
    role: "Tech Blogger",
    content: "The community around Scriptorium is fantastic. I get to share my coding tips and blog posts, and learn from others. It’s a great place for both beginners and experienced developers to grow together."
  }
];

export function TestimonialCarousel() {

  const [activeSlide, setActiveSlide] = useState(0);
  const slides = testimonials.map((item, index) => (
    <Carousel.Slide key={index}>
      <Card {...{index, ...item}} />
    </Carousel.Slide>
  ));


  function Card({ name, role, content, index }: CardProps) {
    return (
      <div className={`p-8 h-5/6 sm:h-64 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out ${activeSlide === index && 'shadow-xl'}`}>
        <div className="mb-2">
          <h3 className="text-xl font-semibold text-blue-800 mb-0">{name}</h3>
          <p className="text-sm text-gray-600">{role}</p>
        </div>
        <p className="text-base text-gray-700">{content}</p>
      </div>
    );
  }

  return (
    <Carousel
      slideSize={{ base: '80%', sm: '60%', md: '40%' }}
      slideGap="xl"
      align="center"
      slidesToScroll={1}
      loop
      withIndicators
      height={350}
      onSlideChange={(index) => {setActiveSlide(index)}}
    >
      {slides}
    </Carousel>
  );
}
