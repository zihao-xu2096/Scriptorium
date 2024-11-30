import Link from 'next/link';
import { TestimonialCarousel } from "@/components/home/Carousel";

export const LandingPage = () => {
  return (
    <div className="font-sans">
      <section className="relative bg-gradient-to-r from-blue-800 via-indigo-600 to-blue-800 text-white py-24 sm:py-36 lg:py-48">
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-opacity-40 bg-black z-0"></div>
        <div className="container mx-auto px-6 text-center md:text-right relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif leading-tight mb-4 text-white md:text-right">
            Scriptorium:  the new way of writing code
          </h1>
          <p className="text-base md:text-xl mb-8 w-full md:max-w-2xl mx-auto md:mr-0 text-center md:text-left">
            Scriptorium brings the tools of innovation right to your fingertips. Collaborate with a community of coders and watch your ideas evolve into solutions.
          </p>
          <button className="bg-yellow-600 text-white px-6 py-3 rounded-full text-base md:text-lg font-semibold md:transition duration-300 transform ease-[cubic-bezier(.5,2.5,.7,.7] hover:-translate-y-2 hover:shadow-[0_0.5rem_rgba(0,0,0,1)] hover:bg-yellow-700">
            <Link href="/signup">
              <span >
                Get Started Today
              </span>
            </Link>
          </button>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-10">
        <div className="container mx-auto text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-cols-[1.25fr_1fr_1fr] gap-8 sm:gap-12">
            <h2 className="md:col-span-2 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif self-center text-blue-800">
              Why choose Scriptorium?
            </h2>

            <div className="p-6 sm:p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out">
              <h3 className="text-xl sm:text-2xl font-semibold text-blue-800 mb-4">Effortless Code Writing</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Write code quickly and easily with an intuitive editor—get your ideas out without the distractions or hassle.
              </p>
            </div>

            <div className="lg:row-span-2 p-6 sm:p-8 bg-gradient-to-r from-blue-200 via-indigo-300 to-blue-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out">
              <h3 className="text-xl sm:text-2xl font-semibold text-blue-800 mb-4">Clean, Clear Syntax Highlighting</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Your code, easy to read. Syntax highlighting that helps you spot issues and understand your code faster.
              </p>
            </div>

            <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-300 to-indigo-500 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out">
              <h3 className="text-xl sm:text-2xl font-semibold text-blue-800 mb-4">Instant Code Execution</h3>
              <p className="text-gray-600 text-sm sm:text-base">
              Write, run, and see results instantly. Get immediate feedback so you can fix bugs or refine your code on the spot.
              </p>
            </div>

            <div className="p-6 sm:p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out">
              <h3 className="text-xl sm:text-2xl font-semibold text-blue-800 mb-4">Share Your Knowledge with Blog Posts</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Share your coding journey with blog posts. Link to your code, write tutorials, and help others learn while refining your own skills.
              </p>
            </div>

            <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out">
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">Fork and Build on Code</h3>
              <p className="text-gray-200 text-sm sm:text-base">
                Found something you like? Fork it, tweak it, and make it your own. Build on others’ work to create something even bigger.
              </p>
            </div>

            <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out">
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">Customizable Dark and Light Themes</h3>
              <p className="text-gray-200 text-sm sm:text-base">
                Dark mode for late-night coding, light mode for daytime focus—switch themes to match your workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-serif text-blue-800 mb-12">
            What Our Users Say
          </h2>
          <div className="h-auto">
            <TestimonialCarousel />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-32 bg-blue-800 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-serif mb-8">Ready to Start Coding?</h2>
          <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
            Join the community of developers who are already using Scriptorium to enhance their coding experience. Whether you're a beginner or an expert, we’ve got something for everyone!
          </p>
          <Link href="/signup">
            <span className="bg-yellow-500 text-blue-800 py-3 px-10 rounded-lg text-xl font-semibold hover:bg-yellow-400 transition duration-300 ease-in-out cursor-pointer">
              Create Your Account
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
};
