"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconLoader2,
  IconCheck,
  IconCamera,
  IconTrash,
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string | null;
}

export function StudentProfileClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profile");
      const data = await response.json();

      if (response.ok) {
        setProfile(data.user);
        setFormData({
          name: data.user.name || "",
          phone: data.user.phone || "",
        });
        setAvatarPreview(data.user.avatar);
      } else {
        toast.error(data.error || "Gagal memuat profil");
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
      toast.error("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Mohon upload file gambar");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 2MB");
      return;
    }

    try {
      setUploadingAvatar(true);
      const supabase = createClient();

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${profile?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        // If bucket doesn't exist, try materials bucket as fallback
        const { error: fallbackError } = await supabase.storage
          .from("materials")
          .upload(`avatars/${fileName}`, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (fallbackError) {
          throw new Error("Gagal upload avatar: " + fallbackError.message);
        }

        // Get public URL from materials bucket
        const { data: urlData } = supabase.storage
          .from("materials")
          .getPublicUrl(`avatars/${fileName}`);

        setAvatarPreview(urlData.publicUrl);
        await updateAvatarInProfile(urlData.publicUrl);
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        setAvatarPreview(urlData.publicUrl);
        await updateAvatarInProfile(urlData.publicUrl);
      }

      toast.success("Avatar berhasil diupload");
    } catch (error: any) {
      console.error("Upload avatar error:", error);
      toast.error(error.message || "Gagal upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const updateAvatarInProfile = async (avatarUrl: string) => {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar: avatarUrl }),
    });

    if (response.ok) {
      const data = await response.json();
      setProfile(data.user);
      router.refresh();
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: null }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setAvatarPreview(null);
        toast.success("Avatar dihapus");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Gagal menghapus avatar");
      }
    } catch (error) {
      console.error("Remove avatar error:", error);
      toast.error("Gagal menghapus avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Profil berhasil diperbarui");
        setProfile(data.user);
        router.refresh();
      } else {
        toast.error(data.error || "Gagal memperbarui profil");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profil Saya</h1>
        <p className="text-muted-foreground">Kelola informasi akun Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
          <CardDescription>Perbarui detail profil Anda di sini</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section with Upload */}
            <div className="flex items-start gap-6">
              <div className="relative group">
                <Avatar
                  className="h-24 w-24 cursor-pointer"
                  onClick={handleAvatarClick}
                >
                  <AvatarImage
                    src={avatarPreview || ""}
                    alt={profile?.name || ""}
                  />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(profile?.name || "")}
                  </AvatarFallback>
                </Avatar>

                {/* Upload overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={handleAvatarClick}
                >
                  {uploadingAvatar ? (
                    <IconLoader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <IconCamera className="h-6 w-6 text-white" />
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                />
              </div>

              <div className="flex-1 space-y-2">
                <p className="font-medium">{profile?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.email}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  Status: Student
                </p>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarClick}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <IconCamera className="h-4 w-4 mr-1" />
                    )}
                    {avatarPreview ? "Ganti" : "Upload"}
                  </Button>

                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="text-destructive hover:text-destructive"
                    >
                      <IconTrash className="h-4 w-4 mr-1" />
                      Hapus
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG atau GIF. Maks 2MB.
                </p>
              </div>
            </div>

            <Separator />

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <IconUser className="h-4 w-4" />
                Nama Lengkap
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>

            {/* Email Field (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <IconMail className="h-4 w-4" />
                Alamat Email
              </Label>
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email tidak dapat diubah. Hubungi administrator jika perlu.
              </p>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <IconPhone className="h-4 w-4" />
                Nomor Telepon
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Masukkan nomor telepon (opsional)"
              />
            </div>

            <Separator />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <IconCheck className="mr-2 h-4 w-4" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
