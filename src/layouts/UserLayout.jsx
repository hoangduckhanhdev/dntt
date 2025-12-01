import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Chatbox from "../components/chat/Chatbox";
export default function UserLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-dark">
      <Header />
      <main className="flex-1 bg-[#fffaf6] animate-fadeIn">
        <Outlet />
      </main>
      <Footer />
      <Chatbox />
    </div>
  );
}
