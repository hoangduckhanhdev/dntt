import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Globe, Facebook, Linkedin } from "lucide-react";

export default function Contact() {
  const [contact, setContact] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/contact")
      .then(res => setContact(res.data))
      .catch(err => console.error("❌ Lỗi tải dữ liệu liên hệ:", err));
  }, []);

  if (!contact) return <div className="text-center py-20 text-gray-500">Đang tải...</div>;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12"
      style={{
        backgroundImage: contact.background ? `url(${contact.background})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-10">
        {/* Tiêu đề */}
        <h1 className="text-4xl md:text-5xl font-bold text-indigo-700 mb-4 whitespace-pre-line">
          {contact.title}
        </h1>
        <p className="text-gray-700 mb-12 text-lg">{contact.description}</p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-2xl shadow-md border border-indigo-100"
          >
            <Mail className="mx-auto text-indigo-600 mb-3" size={32} />
            <h3 className="font-semibold text-lg">Email</h3>
            <p className="text-gray-600">{contact.email}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-2xl shadow-md border border-indigo-100"
          >
            <Phone className="mx-auto text-indigo-600 mb-3" size={32} />
            <h3 className="font-semibold text-lg">Hotline</h3>
            <p className="text-gray-600">{contact.phone}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-2xl shadow-md border border-indigo-100"
          >
            <MapPin className="mx-auto text-indigo-600 mb-3" size={32} />
            <h3 className="font-semibold text-lg">Địa chỉ</h3>
            <p className="text-gray-600">{contact.address}</p>
          </motion.div>
        </div>

        {contact.socials && contact.socials.length > 0 && (
          <div className="flex justify-center gap-6 mb-12">
            {contact.socials.map((item, index) => {
              const Icon =
                item.icon.toLowerCase() === "facebook"
                  ? Facebook
                  : item.icon.toLowerCase() === "linkedin"
                  ? Linkedin
                  : Globe;
              return (
                <motion.a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2 }}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  <Icon size={32} />
                </motion.a>
              );
            })}
          </div>
        )}

        {contact.mapEmbed && (
          <div className="mt-10">
            <iframe
              src={contact.mapEmbed}
              title="Bản đồ liên hệ"
              className="w-full h-96 rounded-2xl shadow-lg"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
}
