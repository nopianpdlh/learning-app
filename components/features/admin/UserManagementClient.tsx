"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Mail, Phone, Search, Plus, Edit, Trash2 } from "lucide-react";
import { set } from "zod";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

interface UserManagementClientProps {
  users: User[];
}

export function UserManagementClient({
  users: initialUsers,
}: UserManagementClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 10;

  // Initialize Supabase client for auth
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "STUDENT",
    password: "",
    // Tutor-specific fields
    bio: "",
    subjects: "",
    experience: "",
    education: "",
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
        return;
      }

      const newUser = await response.json();
      setUsers([newUser, ...users]);
      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "STUDENT",
        password: "",
        bio: "",
        subjects: "",
        experience: "",
        education: "",
      });
      toast.success("User created successfully!");
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsLoading(true);

    try {
      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
        return;
      }

      const updatedUser = await response.json();
      setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "STUDENT",
        password: "",
        bio: "",
        subjects: "",
        experience: "",
        education: "",
      });
      toast.success("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    toast(`Delete user ${user.name} ?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Confirm",
        onClick: () => deleteUser(user),
      },
    });
  };

  const deleteUser = async (user: User) => {
    setIsLoading(true);

    try {
      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
        return;
      }

      setUsers(users.filter((u) => u.id !== user.id));
      toast.success("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      password: "",
      bio: "",
      subjects: "",
      experience: "",
      education: "",
    });
    setIsEditDialogOpen(true);
  };

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="STUDENT">Students</SelectItem>
              <SelectItem value="TUTOR">Tutors</SelectItem>
              <SelectItem value="ADMIN">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-white border-gray-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-white border-gray-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="bg-white border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-700 font-medium">
                    Role
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="TUTOR">Tutor</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tutor-specific fields - only show when TUTOR role is selected */}
                {formData.role === "TUTOR" && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-700">
                      Informasi Tutor
                    </p>
                    <div className="space-y-2">
                      <Label
                        htmlFor="bio"
                        className="text-gray-700 font-medium"
                      >
                        Bio / Deskripsi
                      </Label>
                      <Textarea
                        id="bio"
                        placeholder="Pengajar bahasa Inggris berpengalaman..."
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        className="bg-white border-gray-300"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="subjects"
                        className="text-gray-700 font-medium"
                      >
                        Subjects (pisahkan dengan koma)
                      </Label>
                      <Input
                        id="subjects"
                        placeholder="English, Grammar, Speaking"
                        value={formData.subjects}
                        onChange={(e) =>
                          setFormData({ ...formData, subjects: e.target.value })
                        }
                        className="bg-white border-gray-300"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="experience"
                          className="text-gray-700 font-medium"
                        >
                          Pengalaman (tahun)
                        </Label>
                        <Input
                          id="experience"
                          type="number"
                          placeholder="5"
                          value={formData.experience}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              experience: e.target.value,
                            })
                          }
                          className="bg-white border-gray-300"
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="education"
                          className="text-gray-700 font-medium"
                        >
                          Pendidikan
                        </Label>
                        <Input
                          id="education"
                          placeholder="S1 Pendidikan"
                          value={formData.education}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              education: e.target.value,
                            })
                          }
                          className="bg-white border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-gray-700 font-medium"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="bg-white border-gray-300"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create User"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditUser} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-name"
                    className="text-gray-700 font-medium"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-white border-gray-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-email"
                    className="text-gray-700 font-medium"
                  >
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-white border-gray-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-phone"
                    className="text-gray-700 font-medium"
                  >
                    Phone
                  </Label>
                  <Input
                    id="edit-phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="bg-white border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-role"
                    className="text-gray-700 font-medium"
                  >
                    Role
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="TUTOR">Tutor</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update User"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Join Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedUsers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-8"
              >
                No users found
              </TableCell>
            </TableRow>
          ) : (
            paginatedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </span>
                    {user.phone && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.role === "ADMIN"
                        ? "default"
                        : user.role === "TUTOR"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell suppressHydrationWarning>
                  {new Date(user.createdAt).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(user)}
                      disabled={isLoading}
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteUser(user)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}{" "}
            results
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                }
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}
