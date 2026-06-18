import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Users, Car, BookOpen, DollarSign, ScrollText,
  Settings, LogOut, Menu, X, Shield, Search, Plus, Edit2, Trash2,
  Check, XCircle, Clock, Eye, TrendingUp, UserCheck, AlertTriangle,
  Activity, Loader2, ChevronDown, MoreVertical, RefreshCw, Lock,
  Bell, Database, Key, Globe, UserPlus, ArrowUpRight, CalendarDays,
  MapPin, Phone, Mail, ChevronRight, CheckCircle2, Ban, AlertCircle,
  FileText, Sliders
} from "lucide-react";
import { supabase, isDemoMode } from "../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Page =
  | "login" | "dashboard" | "admins" | "users" | "drivers"
  | "bookings" | "fares" | "audit" | "settings" | "unauthorized";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  phone?: string;
  created_at: string;
  last_login?: string;
}

interface DriverApp {
  id: string;
  driver_id: string;
  name: string;
  email: string;
  phone: string;
  license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_plate: string;
  status: "pending" | "approved" | "rejected";
  applied_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

interface Booking {
  id: string;
  booking_ref: string;
  passenger_name: string;
  driver_name: string;
  pickup: string;
  dropoff: string;
  fare: number;
  status: "completed" | "cancelled" | "in_progress" | "pending";
  ride_type: "solo" | "group";
  passengers_count: number;
  created_at: string;
}

interface FareSettings {
  solo_base_fare: number;
  solo_per_km: number;
  solo_min_fare: number;
  group_base_fare: number;
  group_per_km: number;
  group_min_fare: number;
  group_max_passengers: number;
  surge_multiplier: number;
  updated_at: string;
  updated_by: string;
}

interface AuditLog {
  id: string;
  action: string;
  action_type: "admin" | "fare" | "driver" | "user" | "system";
  performed_by: string;
  target: string;
  details: string;
  created_at: string;
}

interface Stats {
  passengers: number;
  drivers: number;
  admins: number;
  bookings: number;
  pending_drivers: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_STATS: Stats = {
  passengers: 1247,
  drivers: 89,
  admins: 5,
  bookings: 3821,
  pending_drivers: 12,
  completed: 3245,
  cancelled: 276,
  revenue: 487650,
};

const MOCK_ADMINS: Profile[] = [
  { id: "1", email: "ramos.admin@arangkada.ph", full_name: "Ricardo Ramos", role: "admin", status: "active", phone: "+63 912 345 6789", created_at: "2024-01-15", last_login: "2025-06-17" },
  { id: "2", email: "dela.cruz@arangkada.ph", full_name: "Maria Dela Cruz", role: "admin", status: "active", phone: "+63 917 234 5678", created_at: "2024-02-20", last_login: "2025-06-16" },
  { id: "3", email: "santos.admin@arangkada.ph", full_name: "Jose Santos", role: "admin", status: "inactive", phone: "+63 918 345 6790", created_at: "2024-03-10", last_login: "2025-05-20" },
  { id: "4", email: "reyes.admin@arangkada.ph", full_name: "Ana Reyes", role: "admin", status: "active", phone: "+63 919 456 7891", created_at: "2024-04-05", last_login: "2025-06-15" },
  { id: "5", email: "garcia.admin@arangkada.ph", full_name: "Carlos Garcia", role: "admin", status: "active", phone: "+63 920 567 8902", created_at: "2024-05-12", last_login: "2025-06-17" },
];

const MOCK_PASSENGERS: Profile[] = [
  { id: "p1", email: "juan@gmail.com", full_name: "Juan dela Cruz", role: "passenger", status: "active", phone: "+63 912 111 2222", created_at: "2024-06-01" },
  { id: "p2", email: "maria.reyes@gmail.com", full_name: "Maria Reyes", role: "passenger", status: "active", phone: "+63 917 222 3333", created_at: "2024-06-15" },
  { id: "p3", email: "pedro@yahoo.com", full_name: "Pedro Santos", role: "passenger", status: "suspended", phone: "+63 918 333 4444", created_at: "2024-07-02" },
  { id: "p4", email: "ana.garcia@gmail.com", full_name: "Ana Garcia", role: "passenger", status: "active", phone: "+63 919 444 5555", created_at: "2024-07-10" },
  { id: "p5", email: "carlo.m@outlook.com", full_name: "Carlo Mendoza", role: "passenger", status: "active", phone: "+63 920 555 6666", created_at: "2024-08-01" },
  { id: "p6", email: "liza.t@gmail.com", full_name: "Liza Torres", role: "passenger", status: "active", phone: "+63 921 666 7777", created_at: "2024-08-22" },
];

const MOCK_DRIVERS: Profile[] = [
  { id: "d1", email: "manny.p@gmail.com", full_name: "Manny Pacquiao Jr.", role: "driver", status: "active", phone: "+63 912 777 8888", created_at: "2024-03-05" },
  { id: "d2", email: "bong.c@gmail.com", full_name: "Bong Castillo", role: "driver", status: "active", phone: "+63 917 888 9999", created_at: "2024-04-12" },
  { id: "d3", email: "ryan.v@yahoo.com", full_name: "Ryan Villanueva", role: "driver", status: "suspended", phone: "+63 918 999 0000", created_at: "2024-05-20" },
  { id: "d4", email: "tony.l@gmail.com", full_name: "Tony Lim", role: "driver", status: "active", phone: "+63 919 000 1111", created_at: "2024-06-03" },
];

const MOCK_DRIVER_APPS: DriverApp[] = [
  { id: "da1", driver_id: "da1", name: "Eduardo Fernandez", email: "eduardo.f@gmail.com", phone: "+63 912 123 4567", license_number: "N01-23-456789", vehicle_make: "Toyota", vehicle_model: "Vios", vehicle_year: "2021", vehicle_plate: "ABC 1234", status: "pending", applied_at: "2025-06-10" },
  { id: "da2", driver_id: "da2", name: "Rosario Magno", email: "rosario.m@yahoo.com", phone: "+63 917 234 5678", license_number: "N02-23-567890", vehicle_make: "Honda", vehicle_model: "City", vehicle_year: "2022", vehicle_plate: "DEF 5678", status: "pending", applied_at: "2025-06-12" },
  { id: "da3", driver_id: "da3", name: "Bernardo Cruz", email: "bernardo.c@gmail.com", phone: "+63 918 345 6789", license_number: "N03-22-678901", vehicle_make: "Mitsubishi", vehicle_model: "Mirage", vehicle_year: "2020", vehicle_plate: "GHI 9012", status: "pending", applied_at: "2025-06-14" },
  { id: "da4", driver_id: "da4", name: "Ligaya Reyes", email: "ligaya.r@gmail.com", phone: "+63 919 456 7890", license_number: "N04-23-789012", vehicle_make: "Suzuki", vehicle_model: "Celerio", vehicle_year: "2021", vehicle_plate: "JKL 3456", status: "approved", applied_at: "2025-06-01", reviewed_at: "2025-06-05", reviewed_by: "Maria Dela Cruz" },
  { id: "da5", driver_id: "da5", name: "Arturo Bautista", email: "arturo.b@gmail.com", phone: "+63 920 567 8901", license_number: "N05-21-890123", vehicle_make: "Toyota", vehicle_model: "Wigo", vehicle_year: "2019", vehicle_plate: "MNO 7890", status: "rejected", applied_at: "2025-05-28", reviewed_at: "2025-06-02", reviewed_by: "Ricardo Ramos" },
  { id: "da6", driver_id: "da6", name: "Cristina Aquino", email: "cristina.a@outlook.com", phone: "+63 921 678 9012", license_number: "N06-23-901234", vehicle_make: "Kia", vehicle_model: "Picanto", vehicle_year: "2022", vehicle_plate: "PQR 1234", status: "pending", applied_at: "2025-06-15" },
  { id: "da7", driver_id: "da7", name: "Fernando Ocampo", email: "fernando.o@gmail.com", phone: "+63 922 789 0123", license_number: "N07-22-012345", vehicle_make: "Hyundai", vehicle_model: "Eon", vehicle_year: "2020", vehicle_plate: "STU 5678", status: "pending", applied_at: "2025-06-16" },
];

const MOCK_BOOKINGS: Booking[] = [
  { id: "b1", booking_ref: "ARK-240001", passenger_name: "Juan dela Cruz", driver_name: "Manny Pacquiao Jr.", pickup: "SM Mall of Asia, Pasay", dropoff: "Bonifacio Global City, Taguig", fare: 185, status: "completed", ride_type: "solo", passengers_count: 1, created_at: "2025-06-17 14:32" },
  { id: "b2", booking_ref: "ARK-240002", passenger_name: "Maria Reyes", driver_name: "Bong Castillo", pickup: "Quezon City Hall", dropoff: "Eastwood City, Quezon City", fare: 120, status: "completed", ride_type: "solo", passengers_count: 1, created_at: "2025-06-17 13:15" },
  { id: "b3", booking_ref: "ARK-240003", passenger_name: "Ana Garcia", driver_name: "Tony Lim", pickup: "Robinsons Galleria, Ortigas", dropoff: "Manila Cathedral, Intramuros", fare: 340, status: "in_progress", ride_type: "group", passengers_count: 3, created_at: "2025-06-17 15:45" },
  { id: "b4", booking_ref: "ARK-240004", passenger_name: "Carlo Mendoza", driver_name: "Manny Pacquiao Jr.", pickup: "Makati Medical Center", dropoff: "NAIA Terminal 3, Pasay", fare: 410, status: "completed", ride_type: "solo", passengers_count: 1, created_at: "2025-06-16 08:22" },
  { id: "b5", booking_ref: "ARK-240005", passenger_name: "Liza Torres", driver_name: "Bong Castillo", pickup: "University of Santo Tomas", dropoff: "Divisoria, Manila", fare: 95, status: "cancelled", ride_type: "solo", passengers_count: 1, created_at: "2025-06-16 11:00" },
  { id: "b6", booking_ref: "ARK-240006", passenger_name: "Pedro Santos", driver_name: "Tony Lim", pickup: "SM Fairview, Quezon City", dropoff: "Trinoma Mall, Quezon City", fare: 75, status: "completed", ride_type: "solo", passengers_count: 1, created_at: "2025-06-15 16:30" },
  { id: "b7", booking_ref: "ARK-240007", passenger_name: "Ana Garcia", driver_name: "Manny Pacquiao Jr.", pickup: "EDSA MRT Taft Station", dropoff: "Pasay City Hall", fare: 60, status: "completed", ride_type: "solo", passengers_count: 1, created_at: "2025-06-15 09:45" },
  { id: "b8", booking_ref: "ARK-240008", passenger_name: "Juan dela Cruz", driver_name: "Bong Castillo", pickup: "Ortigas Center", dropoff: "San Juan Medical Center", fare: 155, status: "cancelled", ride_type: "group", passengers_count: 2, created_at: "2025-06-14 14:00" },
];

const MOCK_FARES: FareSettings = {
  solo_base_fare: 35,
  solo_per_km: 10,
  solo_min_fare: 45,
  group_base_fare: 25,
  group_per_km: 8,
  group_min_fare: 35,
  group_max_passengers: 4,
  surge_multiplier: 1.5,
  updated_at: "2025-06-10 09:00",
  updated_by: "Super Admin",
};

const MOCK_AUDIT: AuditLog[] = [
  { id: "al1", action: "Admin Account Created", action_type: "admin", performed_by: "Super Admin", target: "Carlos Garcia (carlos.garcia@arangkada.ph)", details: "New admin account created with role: admin", created_at: "2025-06-17 10:30" },
  { id: "al2", action: "Driver Application Approved", action_type: "driver", performed_by: "Maria Dela Cruz", target: "Ligaya Reyes (ARK-DRV-004)", details: "Driver application approved after document verification", created_at: "2025-06-17 09:15" },
  { id: "al3", action: "Fare Settings Updated", action_type: "fare", performed_by: "Super Admin", target: "Solo Ride Fares", details: "Base fare changed from ₱30 to ₱35, per km from ₱9 to ₱10", created_at: "2025-06-16 14:22" },
  { id: "al4", action: "User Account Suspended", action_type: "user", performed_by: "Ricardo Ramos", target: "Pedro Santos (pedro@yahoo.com)", details: "Account suspended for violation of terms of service", created_at: "2025-06-15 11:45" },
  { id: "al5", action: "Driver Application Rejected", action_type: "driver", performed_by: "Ricardo Ramos", target: "Arturo Bautista (ARK-DRV-005)", details: "Application rejected: incomplete documents, expired license", created_at: "2025-06-15 10:00" },
  { id: "al6", action: "System Maintenance Mode Enabled", action_type: "system", performed_by: "Super Admin", target: "System", details: "Maintenance mode enabled for database migration", created_at: "2025-06-14 02:00" },
  { id: "al7", action: "Admin Account Deactivated", action_type: "admin", performed_by: "Super Admin", target: "Jose Santos (santos.admin@arangkada.ph)", details: "Admin account deactivated due to inactivity", created_at: "2025-06-12 16:30" },
  { id: "al8", action: "Group Fare Settings Updated", action_type: "fare", performed_by: "Super Admin", target: "Group Ride Fares", details: "Max passengers changed from 3 to 4", created_at: "2025-06-10 09:00" },
];

// ─── Utility Components ───────────────────────────────────────────────────────

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info" | "muted" }) {
  const variants = {
    default: "bg-[#C9952A]/15 text-[#C9952A] border border-[#C9952A]/30",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
    danger: "bg-red-500/10 text-red-400 border border-red-500/25",
    info: "bg-blue-500/10 text-blue-400 border border-blue-500/25",
    muted: "bg-white/5 text-foreground/50 border border-white/10",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono ${variants[variant]}`}>
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = "gold" }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color?: "gold" | "maroon" | "green" | "red" }) {
  const colors = {
    gold: "text-[#C9952A] bg-[#C9952A]/10",
    maroon: "text-[#E05555] bg-[#7A1414]/20",
    green: "text-emerald-400 bg-emerald-400/10",
    red: "text-red-400 bg-red-400/10",
  };
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-start gap-4 hover:border-[#C9952A]/30 transition-colors">
      <div className={`p-2.5 rounded-lg ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-foreground text-2xl font-semibold font-['Crimson_Pro'] mt-0.5">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-muted-foreground text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder = "Search..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#1E0808] border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C9952A]/50 transition-colors"
      />
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[#1E0808] border border-border rounded-md pl-3 pr-8 py-2 text-sm text-foreground focus:outline-none focus:border-[#C9952A]/50 transition-colors cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#1E0808]">{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#160505] border border-border rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-['Crimson_Pro'] text-xl text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm text-muted-foreground mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full bg-[#1E0808] border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C9952A]/60 transition-colors"
      />
    </div>
  );
}

function GoldButton({ children, onClick, disabled, className = "", variant = "primary" }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; variant?: "primary" | "outline" | "danger";
}) {
  const variants = {
    primary: "bg-[#C9952A] text-[#080202] hover:bg-[#E8B84B] disabled:opacity-40",
    outline: "border border-[#C9952A]/50 text-[#C9952A] hover:bg-[#C9952A]/10",
    danger: "bg-red-900/40 text-red-400 border border-red-500/30 hover:bg-red-900/60",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <FileText size={36} className="opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS: { icon: React.ElementType; label: string; page: Page }[] = [
  { icon: LayoutDashboard, label: "Dashboard", page: "dashboard" },
  { icon: Shield, label: "Admin Management", page: "admins" },
  { icon: Users, label: "User Management", page: "users" },
  { icon: Car, label: "Driver Applications", page: "drivers" },
  { icon: BookOpen, label: "Booking Records", page: "bookings" },
  { icon: DollarSign, label: "Fare Settings", page: "fares" },
  { icon: ScrollText, label: "Audit Logs", page: "audit" },
  { icon: Settings, label: "System Settings", page: "settings" },
];

function Sidebar({ currentPage, onNavigate, onLogout, collapsed, onToggle }: {
  currentPage: Page; onNavigate: (p: Page) => void; onLogout: () => void; collapsed: boolean; onToggle: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onToggle} />
      )}

      <aside className={`fixed top-0 left-0 h-full z-30 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${collapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "translate-x-0 w-64"}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border min-h-[65px]">
          <div className="flex-shrink-0 w-8 h-8 bg-[#C9952A] rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-[#080202]" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-['Crimson_Pro'] text-lg text-foreground leading-tight">Arangkada</p>
              <p className="text-[10px] text-[#C9952A] font-mono uppercase tracking-widest leading-tight">Super Admin</p>
            </div>
          )}
          <button
            onClick={onToggle}
            className="ml-auto lg:hidden p-1 text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label, page }) => {
            const active = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all group relative ${
                  active
                    ? "bg-[#C9952A]/10 text-[#C9952A] border-r-2 border-[#C9952A]"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="font-medium">{label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#1E0808] border border-border rounded text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={onLogout}
            title={collapsed ? "Sign Out" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function Layout({ children, currentPage, onNavigate, onLogout, adminName }: {
  children: React.ReactNode; currentPage: Page; onNavigate: (p: Page) => void; onLogout: () => void; adminName: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const title = NAV_ITEMS.find((n) => n.page === currentPage)?.label ?? "Dashboard";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}>
        {/* Header */}
        <header className="flex items-center gap-4 px-4 lg:px-6 h-16 bg-[#100303] border-b border-border flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors lg:hidden"
          >
            <Menu size={20} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors hidden lg:flex"
          >
            <Menu size={18} />
          </button>
          <h2 className="font-['Crimson_Pro'] text-xl text-foreground flex-1">{title}</h2>
          {isDemoMode && (
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-xs text-amber-400 font-mono">
              <Activity size={12} />
              Demo Mode
            </span>
          )}
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <div className="w-8 h-8 bg-[#7A1414] rounded-full flex items-center justify-center text-xs font-semibold text-[#C9952A]">
              {adminName.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-foreground font-medium leading-tight">{adminName}</p>
              <p className="text-[10px] text-[#C9952A] font-mono leading-tight">Super Admin</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin, loading, error }: { onLogin: (email: string, pass: string) => void; loading: boolean; error: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative maroon glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7A1414]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[#C9952A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#7A1414] to-[#5C0F0F] border border-[#C9952A]/30 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Shield size={26} className="text-[#C9952A]" />
          </div>
          <h1 className="font-['Crimson_Pro'] text-3xl text-foreground">Arangkada</h1>
          <p className="text-[#C9952A] text-xs font-mono uppercase tracking-[0.2em] mt-1">Super Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-7 shadow-2xl">
          <h2 className="font-['Crimson_Pro'] text-2xl text-foreground mb-1">Sign In</h2>
          <p className="text-muted-foreground text-sm mb-6">Restricted access — authorized personnel only</p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-red-400 text-sm mb-5">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {isDemoMode && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-400 text-xs mb-5">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <div>
                <strong>Demo Mode</strong> — Supabase not connected. Use any credentials to preview the panel. Configure <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> for production.
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@arangkada.ph"
                  className="w-full bg-[#1E0808] border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C9952A]/60 transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && onLogin(email, password)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1E0808] border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C9952A]/60 transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && onLogin(email, password)}
                />
              </div>
            </div>

            <button
              onClick={() => onLogin(email, password)}
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#C9952A] text-[#080202] rounded-lg text-sm font-semibold hover:bg-[#E8B84B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-6 pt-5 border-t border-border">
            <Lock size={12} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No public registration. Accounts created by Super Admin only.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Unauthorized Page ────────────────────────────────────────────────────────

function UnauthorizedPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Ban size={28} className="text-red-400" />
        </div>
        <h1 className="font-['Crimson_Pro'] text-3xl text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-sm mb-2">Your account does not have super admin privileges.</p>
        <p className="text-muted-foreground text-xs mb-8">Only accounts with <span className="text-[#C9952A] font-mono">role = super_admin</span> can access this panel.</p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors mx-auto"
        >
          <LogOut size={15} />
          Back to Login
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

function DashboardPage({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Passengers" value={stats.passengers} sub="Registered users" color="gold" />
        <StatCard icon={Car} label="Active Drivers" value={stats.drivers} sub="Verified drivers" color="gold" />
        <StatCard icon={Shield} label="Admins" value={stats.admins} sub="Active accounts" color="maroon" />
        <StatCard icon={BookOpen} label="Total Bookings" value={stats.bookings} sub="All time" color="gold" />
        <StatCard icon={Clock} label="Pending Drivers" value={stats.pending_drivers} sub="Awaiting review" color="maroon" />
        <StatCard icon={CheckCircle2} label="Completed Rides" value={stats.completed} sub="Successfully completed" color="green" />
        <StatCard icon={XCircle} label="Cancelled Rides" value={stats.cancelled} sub="Rider cancellations" color="red" />
        <StatCard icon={TrendingUp} label="Total Revenue" value={`₱${stats.revenue.toLocaleString()}`} sub="Gross earnings" color="green" />
      </div>

      {/* Recent bookings */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-['Crimson_Pro'] text-lg text-foreground">Recent Bookings</h3>
            <Badge>Live</Badge>
          </div>
          <div className="divide-y divide-border">
            {MOCK_BOOKINGS.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${b.status === "completed" ? "bg-emerald-400" : b.status === "cancelled" ? "bg-red-400" : "bg-amber-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{b.passenger_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.pickup} → {b.dropoff}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-[#C9952A] font-mono">₱{b.fare}</p>
                  <p className="text-[10px] text-muted-foreground">{b.created_at.split(" ")[1]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent audit logs */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-['Crimson_Pro'] text-lg text-foreground">Audit Log</h3>
            <Badge variant="muted">Recent</Badge>
          </div>
          <div className="divide-y divide-border">
            {MOCK_AUDIT.slice(0, 5).map((log) => {
              const colors: Record<string, string> = { admin: "text-[#C9952A]", fare: "text-blue-400", driver: "text-emerald-400", user: "text-amber-400", system: "text-purple-400" };
              return (
                <div key={log.id} className="px-4 py-3 hover:bg-white/2 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${colors[log.action_type]}`}>{log.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{log.target}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap font-mono">{log.created_at.split(" ")[1]}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">by {log.performed_by}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Management Page ────────────────────────────────────────────────────

function AdminManagementPage() {
  const [admins, setAdmins] = useState(MOCK_ADMINS);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<Profile | null>(null);
  const [newAdmin, setNewAdmin] = useState({ email: "", full_name: "", phone: "", password: "" });
  const [toast, setToast] = useState("");

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const filtered = admins.filter((a) =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id: string) => {
    setAdmins((prev) => prev.map((a) => a.id === id ? { ...a, status: a.status === "active" ? "inactive" : "active" } : a));
    notify("Admin status updated.");
  };

  const deleteAdmin = (id: string) => {
    setAdmins((prev) => prev.filter((a) => a.id !== id));
    notify("Admin account deleted.");
  };

  const createAdmin = () => {
    if (!newAdmin.email || !newAdmin.full_name) return;
    const a: Profile = { id: Date.now().toString(), ...newAdmin, role: "admin", status: "active", created_at: new Date().toISOString().split("T")[0] };
    setAdmins((prev) => [a, ...prev]);
    setNewAdmin({ email: "", full_name: "", phone: "", password: "" });
    setShowCreate(false);
    notify("Admin account created successfully.");
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-[#1E0808] border border-[#C9952A]/40 rounded-lg text-sm text-foreground shadow-xl">
          <CheckCircle2 size={15} className="text-[#C9952A]" />
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="w-full sm:w-72">
          <SearchBar value={search} onChange={setSearch} placeholder="Search admins..." />
        </div>
        <GoldButton onClick={() => setShowCreate(true)}>
          <UserPlus size={15} />
          Create Admin
        </GoldButton>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Name", "Email", "Phone", "Status", "Last Login", "Created", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><EmptyState message="No admins found" /></td></tr>
              ) : filtered.map((a) => (
                <tr key={a.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-[#7A1414]/50 rounded-full flex items-center justify-center text-[#C9952A] text-xs font-semibold flex-shrink-0">
                        {a.full_name.charAt(0)}
                      </div>
                      <span className="text-sm text-foreground whitespace-nowrap">{a.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{a.email}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{a.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.status === "active" ? "success" : "muted"}>{a.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{a.last_login || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{a.created_at}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowEdit(a)} className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => toggleStatus(a.id)} className={`p-1.5 rounded hover:bg-white/5 transition-colors ${a.status === "active" ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"}`} title={a.status === "active" ? "Deactivate" : "Activate"}>
                        {a.status === "active" ? <Ban size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button onClick={() => deleteAdmin(a.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Admin Account">
        <div className="space-y-4">
          <Input label="Full Name" value={newAdmin.full_name} onChange={(e) => setNewAdmin({ ...newAdmin, full_name: e.target.value })} placeholder="Juan dela Cruz" />
          <Input label="Email Address" type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} placeholder="admin@arangkada.ph" />
          <Input label="Phone Number" value={newAdmin.phone} onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })} placeholder="+63 912 345 6789" />
          <Input label="Temporary Password" type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} placeholder="Min. 8 characters" />
          <div className="flex gap-2 pt-2">
            <GoldButton onClick={createAdmin} className="flex-1 justify-center"><UserPlus size={15} />Create Account</GoldButton>
            <GoldButton variant="outline" onClick={() => setShowCreate(false)} className="flex-1 justify-center"><X size={15} />Cancel</GoldButton>
          </div>
        </div>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal open={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Admin">
        {showEdit && (
          <div className="space-y-4">
            <Input label="Full Name" defaultValue={showEdit.full_name} />
            <Input label="Email" defaultValue={showEdit.email} />
            <Input label="Phone" defaultValue={showEdit.phone} />
            <div className="flex gap-2 pt-2">
              <GoldButton onClick={() => { setShowEdit(null); notify("Admin updated."); }} className="flex-1 justify-center"><Check size={15} />Save Changes</GoldButton>
              <GoldButton variant="outline" onClick={() => setShowEdit(null)} className="flex-1 justify-center"><X size={15} />Cancel</GoldButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── User Management Page ─────────────────────────────────────────────────────

function UserManagementPage() {
  const [tab, setTab] = useState<"passengers" | "drivers">("passengers");
  const [search, setSearch] = useState("");

  const data = tab === "passengers" ? MOCK_PASSENGERS : MOCK_DRIVERS;
  const filtered = data.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-lg w-fit">
        {(["passengers", "drivers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? "bg-[#C9952A] text-[#080202]" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="w-full sm:w-72">
        <SearchBar value={search} onChange={setSearch} placeholder={`Search ${tab}...`} />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Name", "Email", "Phone", "Role", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><EmptyState message={`No ${tab} found`} /></td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-[#220808] border border-border rounded-full flex items-center justify-center text-[#C9952A] text-xs font-semibold flex-shrink-0">
                        {u.full_name.charAt(0)}
                      </div>
                      <span className="text-sm text-foreground whitespace-nowrap">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{u.phone || "—"}</td>
                  <td className="px-4 py-3"><Badge variant="muted">{u.role}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={u.status === "active" ? "success" : u.status === "suspended" ? "danger" : "muted"}>{u.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{u.created_at}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" title="View"><Eye size={14} /></button>
                      <button className="p-1.5 rounded hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 transition-colors" title="Suspend"><Ban size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Driver Applications Page ─────────────────────────────────────────────────

function DriverApplicationsPage() {
  const [apps, setApps] = useState(MOCK_DRIVER_APPS);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DriverApp | null>(null);
  const [toast, setToast] = useState("");

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const review = (id: string, status: "approved" | "rejected") => {
    setApps((prev) => prev.map((a) => a.id === id ? { ...a, status, reviewed_at: new Date().toISOString(), reviewed_by: "Super Admin" } : a));
    setSelected(null);
    notify(`Application ${status}.`);
  };

  const filtered = apps
    .filter((a) => a.status === tab)
    .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.license_number.toLowerCase().includes(search.toLowerCase()));

  const counts = { pending: apps.filter((a) => a.status === "pending").length, approved: apps.filter((a) => a.status === "approved").length, rejected: apps.filter((a) => a.status === "rejected").length };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-[#1E0808] border border-[#C9952A]/40 rounded-lg text-sm text-foreground shadow-xl">
          <CheckCircle2 size={15} className="text-[#C9952A]" />
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 p-1 bg-card border border-border rounded-lg">
          {(["pending", "approved", "rejected"] as const).map((t) => {
            const colors = { pending: "bg-amber-500 text-[#080202]", approved: "bg-emerald-500 text-[#080202]", rejected: "bg-red-500 text-white" };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? colors[t] : "text-muted-foreground hover:text-foreground"}`}
              >
                {t}
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${tab === t ? "bg-black/20" : "bg-white/5"}`}>{counts[t]}</span>
              </button>
            );
          })}
        </div>
        <div className="w-full sm:w-64">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or license..." />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg"><EmptyState message={`No ${tab} applications`} /></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((app) => (
            <div key={app.id} className="bg-card border border-border rounded-lg p-4 hover:border-[#C9952A]/30 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-foreground font-medium">{app.name}</p>
                  <p className="text-xs text-muted-foreground">{app.email}</p>
                </div>
                <Badge variant={app.status === "pending" ? "warning" : app.status === "approved" ? "success" : "danger"}>
                  {app.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div><span className="text-muted-foreground">License: </span><span className="text-foreground font-mono">{app.license_number}</span></div>
                <div><span className="text-muted-foreground">Plate: </span><span className="text-foreground font-mono">{app.vehicle_plate}</span></div>
                <div><span className="text-muted-foreground">Vehicle: </span><span className="text-foreground">{app.vehicle_year} {app.vehicle_make} {app.vehicle_model}</span></div>
                <div><span className="text-muted-foreground">Phone: </span><span className="text-foreground">{app.phone}</span></div>
                <div><span className="text-muted-foreground">Applied: </span><span className="text-foreground font-mono">{app.applied_at}</span></div>
                {app.reviewed_by && <div><span className="text-muted-foreground">By: </span><span className="text-foreground">{app.reviewed_by}</span></div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelected(app)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-[#C9952A]/40 transition-colors">
                  <Eye size={13} /> View Details
                </button>
                {app.status === "pending" && (
                  <>
                    <button onClick={() => review(app.id, "approved")} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                      <Check size={13} /> Approve
                    </button>
                    <button onClick={() => review(app.id, "rejected")} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 hover:bg-red-500/20 transition-colors">
                      <XCircle size={13} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Driver Application Details">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground text-xs mb-1">Full Name</p><p className="text-foreground">{selected.name}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Email</p><p className="text-foreground">{selected.email}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Phone</p><p className="text-foreground">{selected.phone}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">License Number</p><p className="text-foreground font-mono">{selected.license_number}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Vehicle</p><p className="text-foreground">{selected.vehicle_year} {selected.vehicle_make} {selected.vehicle_model}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Plate Number</p><p className="text-foreground font-mono">{selected.vehicle_plate}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Applied On</p><p className="text-foreground font-mono">{selected.applied_at}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Status</p><Badge variant={selected.status === "pending" ? "warning" : selected.status === "approved" ? "success" : "danger"}>{selected.status}</Badge></div>
            </div>
            {selected.status === "pending" && (
              <div className="flex gap-2 pt-2 border-t border-border">
                <button onClick={() => review(selected.id, "approved")} className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                  <Check size={15} /> Approve
                </button>
                <button onClick={() => review(selected.id, "rejected")} className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors">
                  <XCircle size={15} /> Reject
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Booking Records Page ─────────────────────────────────────────────────────

function BookingRecordsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = MOCK_BOOKINGS.filter((b) => {
    const matchSearch = b.passenger_name.toLowerCase().includes(search.toLowerCase()) ||
      b.driver_name.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_ref.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const matchType = typeFilter === "all" || b.ride_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const statusBadge = (s: string) => {
    const map: Record<string, "success" | "danger" | "warning" | "info"> = {
      completed: "success", cancelled: "danger", in_progress: "warning", pending: "info",
    };
    return <Badge variant={map[s] || "muted"}>{s.replace("_", " ")}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by passenger, driver, or ref..." />
        </div>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "All Status", value: "all" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
            { label: "In Progress", value: "in_progress" },
            { label: "Pending", value: "pending" },
          ]}
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          options={[{ label: "All Types", value: "all" }, { label: "Solo", value: "solo" }, { label: "Group", value: "group" }]}
        />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">{filtered.length}</span> records</p>
          <GoldButton variant="outline" className="text-xs py-1.5"><RefreshCw size={13} />Refresh</GoldButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Ref #", "Passenger", "Driver", "Pickup", "Dropoff", "Type", "Fare", "Status", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={9}><EmptyState message="No bookings found" /></td></tr>
              ) : filtered.map((b) => (
                <tr key={b.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-[#C9952A] whitespace-nowrap">{b.booking_ref}</td>
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{b.passenger_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{b.driver_name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{b.pickup}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{b.dropoff}</td>
                  <td className="px-4 py-3"><Badge variant={b.ride_type === "solo" ? "info" : "default"}>{b.ride_type}</Badge></td>
                  <td className="px-4 py-3 text-sm font-mono text-[#C9952A] whitespace-nowrap">₱{b.fare}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{statusBadge(b.status)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{b.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Fare Settings Page ───────────────────────────────────────────────────────

function FareSettingsPage() {
  const [fares, setFares] = useState(MOCK_FARES);
  const [saved, setSaved] = useState(false);

  const update = (key: keyof FareSettings, value: string) => {
    setFares((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
    setSaved(false);
  };

  const save = () => {
    setFares((prev) => ({ ...prev, updated_at: new Date().toLocaleString(), updated_by: "Super Admin" }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const FareInput = ({ label, field, prefix = "₱", suffix }: { label: string; field: keyof FareSettings; prefix?: string; suffix?: string }) => (
    <div>
      <label className="block text-sm text-muted-foreground mb-1.5">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>}
        <input
          type="number"
          value={fares[field] as number}
          onChange={(e) => update(field, e.target.value)}
          step="0.5"
          min="0"
          className={`w-full bg-[#1E0808] border border-border rounded-lg ${prefix ? "pl-7" : "pl-3"} ${suffix ? "pr-12" : "pr-3"} py-2.5 text-sm text-foreground focus:outline-none focus:border-[#C9952A]/60 transition-colors font-mono`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-400 text-sm">
          <CheckCircle2 size={15} />
          Fare settings saved successfully. Audit log created.
        </div>
      )}

      {/* Solo Ride */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-[#1A0707]">
          <div className="p-2 bg-[#C9952A]/10 rounded-lg"><Users size={16} className="text-[#C9952A]" /></div>
          <div>
            <h3 className="font-['Crimson_Pro'] text-lg text-foreground">Solo Ride Fares</h3>
            <p className="text-xs text-muted-foreground">For single-passenger bookings</p>
          </div>
        </div>
        <div className="p-5 grid sm:grid-cols-3 gap-4">
          <FareInput label="Base Fare" field="solo_base_fare" />
          <FareInput label="Per Kilometer" field="solo_per_km" suffix="/km" />
          <FareInput label="Minimum Fare" field="solo_min_fare" />
        </div>
      </div>

      {/* Group Ride */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-[#1A0707]">
          <div className="p-2 bg-[#C9952A]/10 rounded-lg"><Users size={16} className="text-[#C9952A]" /></div>
          <div>
            <h3 className="font-['Crimson_Pro'] text-lg text-foreground">Group Ride Fares</h3>
            <p className="text-xs text-muted-foreground">Per-person fares for shared rides</p>
          </div>
        </div>
        <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FareInput label="Base Fare (per person)" field="group_base_fare" />
          <FareInput label="Per Kilometer" field="group_per_km" suffix="/km" />
          <FareInput label="Minimum Fare" field="group_min_fare" />
          <FareInput label="Max Passengers" field="group_max_passengers" prefix="" suffix="pax" />
        </div>
      </div>

      {/* Surge */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-[#1A0707]">
          <div className="p-2 bg-[#C9952A]/10 rounded-lg"><TrendingUp size={16} className="text-[#C9952A]" /></div>
          <div>
            <h3 className="font-['Crimson_Pro'] text-lg text-foreground">Surge Pricing</h3>
            <p className="text-xs text-muted-foreground">Applied during high-demand periods</p>
          </div>
        </div>
        <div className="p-5 max-w-xs">
          <FareInput label="Surge Multiplier" field="surge_multiplier" prefix="" suffix="×" />
          <p className="text-xs text-muted-foreground mt-2">e.g., 1.5× means 50% more than standard fare</p>
        </div>
      </div>

      {/* Meta & Save */}
      <div className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg">
        <div className="text-xs text-muted-foreground">
          <p>Last updated: <span className="text-foreground font-mono">{fares.updated_at}</span></p>
          <p>Updated by: <span className="text-foreground">{fares.updated_by}</span></p>
        </div>
        <GoldButton onClick={save}>
          <Check size={15} />
          Save Fare Settings
        </GoldButton>
      </div>
    </div>
  );
}

// ─── Audit Logs Page ──────────────────────────────────────────────────────────

function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = MOCK_AUDIT.filter((l) => {
    const matchSearch = l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.performed_by.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || l.action_type === typeFilter;
    return matchSearch && matchType;
  });

  const typeColors: Record<string, "gold" | "success" | "info" | "warning" | "danger"> = {
    admin: "gold", fare: "info", driver: "success", user: "warning", system: "danger",
  };

  const typeIcons: Record<string, React.ElementType> = {
    admin: Shield, fare: DollarSign, driver: Car, user: Users, system: Settings,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by action, admin, or target..." />
        </div>
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: "All Types", value: "all" },
            { label: "Admin Actions", value: "admin" },
            { label: "Fare Changes", value: "fare" },
            { label: "Driver Actions", value: "driver" },
            { label: "User Actions", value: "user" },
            { label: "System Events", value: "system" },
          ]}
        />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">{filtered.length}</span> log entries</p>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <EmptyState message="No audit logs found" />
          ) : filtered.map((log) => {
            const IconComp = typeIcons[log.action_type] || Activity;
            return (
              <div key={log.id} className="flex gap-4 px-4 py-4 hover:bg-white/2 transition-colors">
                <div className={`flex-shrink-0 mt-0.5 p-2 rounded-lg bg-card border border-border`}>
                  <IconComp size={14} className={
                    log.action_type === "admin" ? "text-[#C9952A]" :
                    log.action_type === "fare" ? "text-blue-400" :
                    log.action_type === "driver" ? "text-emerald-400" :
                    log.action_type === "user" ? "text-amber-400" : "text-purple-400"
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm text-foreground font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground font-mono whitespace-nowrap flex-shrink-0">{log.created_at}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1.5">Target: <span className="text-foreground/70">{log.target}</span></p>
                  <p className="text-xs text-muted-foreground">{log.details}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={typeColors[log.action_type] || "muted"}>{log.action_type}</Badge>
                    <span className="text-xs text-muted-foreground">by {log.performed_by}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── System Settings Page ─────────────────────────────────────────────────────

function SystemSettingsPage() {
  const [maintenance, setMaintenance] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  const Toggle = ({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-0">
      <div>
        <p className="text-sm text-foreground font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`flex-shrink-0 relative w-11 h-6 rounded-full transition-colors ${value ? "bg-[#C9952A]" : "bg-[#3A1010]"}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-400 text-sm">
          <CheckCircle2 size={15} />
          System settings saved. Changes logged.
        </div>
      )}

      {/* App Info */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-[#1A0707]">
          <h3 className="font-['Crimson_Pro'] text-lg text-foreground">Application Info</h3>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-4">
          <Input label="App Name" defaultValue="Arangkada" />
          <Input label="App Version" defaultValue="2.1.4" />
          <Input label="Support Email" defaultValue="support@arangkada.ph" />
          <Input label="Support Phone" defaultValue="+63 2 8888 0000" />
          <div className="sm:col-span-2">
            <label className="block text-sm text-muted-foreground mb-1.5">App Description</label>
            <textarea
              defaultValue="Arangkada is a motorcycle taxi hailing app connecting passengers with verified tricycle and motorcycle drivers across the Philippines."
              rows={3}
              className="w-full bg-[#1E0808] border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C9952A]/60 transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-[#1A0707]">
          <h3 className="font-['Crimson_Pro'] text-lg text-foreground">Feature Controls</h3>
        </div>
        <div className="px-5">
          <Toggle label="Maintenance Mode" desc="Disables booking for all users. Display maintenance message." value={maintenance} onChange={setMaintenance} />
          <Toggle label="Email Notifications" desc="Send booking confirmations and alerts via email." value={emailNotifs} onChange={setEmailNotifs} />
          <Toggle label="SMS Notifications" desc="Send OTPs and status updates via SMS gateway." value={smsNotifs} onChange={setSmsNotifs} />
          <Toggle label="Auto-Approve Drivers" desc="Automatically approve driver applications (not recommended)." value={autoApprove} onChange={setAutoApprove} />
        </div>
      </div>

      {/* Database */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-[#1A0707]">
          <h3 className="font-['Crimson_Pro'] text-lg text-foreground">Database & Security</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#1E0808] border border-border rounded-lg">
            <div className="flex items-center gap-2">
              <Database size={15} className="text-[#C9952A]" />
              <div>
                <p className="text-sm text-foreground">Supabase Connection</p>
                <p className="text-xs text-muted-foreground">{isDemoMode ? "Not connected — Demo mode active" : "Connected to production database"}</p>
              </div>
            </div>
            <Badge variant={isDemoMode ? "warning" : "success"}>{isDemoMode ? "Demo" : "Live"}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#1E0808] border border-border rounded-lg">
            <div className="flex items-center gap-2">
              <Key size={15} className="text-[#C9952A]" />
              <div>
                <p className="text-sm text-foreground">Row Level Security</p>
                <p className="text-xs text-muted-foreground">RLS policies enforce super_admin role checks</p>
              </div>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#1E0808] border border-border rounded-lg">
            <div className="flex items-center gap-2">
              <Globe size={15} className="text-[#C9952A]" />
              <div>
                <p className="text-sm text-foreground">Deployment</p>
                <p className="text-xs text-muted-foreground">Vercel — separate from main Arangkada app</p>
              </div>
            </div>
            <Badge variant="info">Vercel</Badge>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <GoldButton onClick={save}>
          <Check size={15} />
          Save Settings
        </GoldButton>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [authState, setAuthState] = useState<"loading" | "unauthenticated" | "authenticated" | "unauthorized">("loading");
  const [adminName, setAdminName] = useState("Super Admin");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [stats] = useState(MOCK_STATS);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (isDemoMode) {
        setAuthState("unauthenticated");
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setAuthState("unauthenticated"); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "super_admin") {
          setAdminName(profile.full_name || session.user.email || "Super Admin");
          setAuthState("authenticated");
          setPage("dashboard");
        } else {
          await supabase.auth.signOut();
          setAuthState("unauthorized");
          setPage("unauthorized");
        }
      } catch {
        setAuthState("unauthenticated");
      }
    };
    checkSession();
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    setLoginLoading(true);
    setLoginError("");

    if (isDemoMode) {
      // Demo: accept any credentials
      setTimeout(() => {
        setAdminName("Super Admin (Demo)");
        setAuthState("authenticated");
        setPage("dashboard");
        setLoginLoading(false);
      }, 900);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Login failed");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== "super_admin") {
        await supabase.auth.signOut();
        setAuthState("unauthorized");
        setPage("unauthorized");
        setLoginLoading(false);
        return;
      }

      setAdminName(profile.full_name || email);
      setAuthState("authenticated");
      setPage("dashboard");
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoginLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (!isDemoMode) await supabase.auth.signOut();
    setAuthState("unauthenticated");
    setPage("login");
    setAdminName("Super Admin");
  }, []);

  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#7A1414]/30 border border-[#C9952A]/30 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-[#C9952A]" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 size={15} className="animate-spin text-[#C9952A]" />
            Verifying credentials...
          </div>
        </div>
      </div>
    );
  }

  if (page === "unauthorized" || authState === "unauthorized") {
    return <UnauthorizedPage onBack={handleLogout} />;
  }

  if (authState !== "authenticated") {
    return <LoginPage onLogin={handleLogin} loading={loginLoading} error={loginError} />;
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage stats={stats} />;
      case "admins": return <AdminManagementPage />;
      case "users": return <UserManagementPage />;
      case "drivers": return <DriverApplicationsPage />;
      case "bookings": return <BookingRecordsPage />;
      case "fares": return <FareSettingsPage />;
      case "audit": return <AuditLogsPage />;
      case "settings": return <SystemSettingsPage />;
      default: return <DashboardPage stats={stats} />;
    }
  };

  return (
    <Layout
      currentPage={page}
      onNavigate={setPage}
      onLogout={handleLogout}
      adminName={adminName}
    >
      {renderPage()}
    </Layout>
  );
}
