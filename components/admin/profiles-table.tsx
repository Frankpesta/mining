"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import { User } from "lucide-react";

type Profile = {
  _id: string;
  userId: string;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;
  dateOfBirth?: number | null;
  bio?: string | null;
  profilePictureUrl: string | null;
  createdAt: number;
  updatedAt: number;
};

export function ProfilesTable({ profiles }: { profiles: Profile[] }) {
  const sortedProfiles = [...profiles].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[880px]">
        <TableHeader>
          <TableRow>
            <TableHead>Profile</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProfiles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No profiles found
              </TableCell>
            </TableRow>
          ) : (
            sortedProfiles.map((profile) => (
              <TableRow key={profile._id}>
                <TableCell>
                  {profile.profilePictureUrl ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full">
                      <Image
                        src={profile.profilePictureUrl}
                        alt={profile.firstName || profile.email || "Profile"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {profile.firstName || profile.lastName
                    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
                    : "N/A"}
                </TableCell>
                <TableCell>{profile.email ?? "N/A"}</TableCell>
                <TableCell>{profile.phone ?? "N/A"}</TableCell>
                <TableCell>
                  {profile.city || profile.country
                    ? [profile.city, profile.state, profile.country]
                        .filter(Boolean)
                        .join(", ") || "N/A"
                    : "N/A"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(profile.updatedAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

