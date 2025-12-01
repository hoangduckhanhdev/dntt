import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";

export default function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const total = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
      setCount(total);
    };

    updateCartCount();
    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  return (
    <Link to="/cart" className="relative inline-flex items-center">
      <FaShoppingCart size={22} className="text-gray-600 hover:text-indigo-600 transition" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-2 bg-indigo-600 text-white text-xs font-semibold rounded-full min-w-[18px] h-[18px] grid place-items-center px-[4px]">
          {count}
        </span>
      )}
    </Link>
  );
}
