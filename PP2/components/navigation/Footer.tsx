
export function Footer() {
  <footer id="footer" className="bg-gray-800 text-white p-6 flex flex-col lg:flex-row md:flex-row sm:flex-col justify-between items-center space-y-6 md:space-y-0">
      {/* Contact Information */}
      <div className="contact-info text-center md:text-left">
        <h4 className="text-lg font-semibold mb-2">Contact Us</h4>
        <p className="text-gray-400">Email: contact@mysite.com</p>
        <p className="text-gray-400">Phone: (123) 456-7890</p>
      </div>

      <div className="social-media-links flex justify-center md:justify-end space-x-4">
        <a href="#" className="hover:text-gray-400">Facebook</a>
        <a href="#" className="hover:text-gray-400">Twitter</a>
        <a href="#" className="hover:text-gray-400">Instagram</a>
      </div>
  </footer>
}