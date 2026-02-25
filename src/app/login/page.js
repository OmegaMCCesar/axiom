"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Database, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Aquí deberías setear una cookie de sesión (puedes usar js-cookie)
      document.cookie = "session=true; path=/"; 
      router.push("/");
    } catch (error) {
      alert("Error de acceso: Verifica tus credenciales");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Database className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AXIOM<span className="text-blue-600">_AUTH</span></h1>
          <p className="text-gray-500 text-sm mt-2">Ingresa tus credenciales corporativas</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
            <input 
              type="email" 
              className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> Entrar al Motor
          </button>
        </form>
      </div>
    </div>
  );
}