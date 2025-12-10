import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

// Redirect to programs page since Class model no longer exists
export default async function AdminClasses() {
  redirect("/admin/programs");
}
