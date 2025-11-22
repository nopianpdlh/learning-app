import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

interface HolyGrailLayoutProps {
  children: React.ReactNode;
  role: "admin" | "tutor" | "student";
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export function HolyGrailLayout({
  children,
  role,
  user,
}: HolyGrailLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <div className="flex-1 flex">
        <Sidebar role={role} />

        <main className="flex-1 p-6 bg-gray-50 overflow-auto">{children}</main>

        {/* Optional right sidebar for widgets */}
        <aside className="w-64 bg-white border-l p-4 hidden xl:block">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Upcoming Events</h3>
              <p className="text-xs text-gray-500">No upcoming events</p>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">Recent Activity</h3>
              <p className="text-xs text-gray-500">No recent activity</p>
            </div>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
}
