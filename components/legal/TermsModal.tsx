"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface TermsModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TermsModal({ trigger, open, onOpenChange }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Terms of Service
          </DialogTitle>
          <DialogDescription>Last updated: December 2024</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm text-muted-foreground">
            <section>
              <h3 className="font-semibold text-foreground mb-2">
                1. Acceptance of Terms
              </h3>
              <p>
                By accessing and using Tutor Nomor Satu&apos;s e-learning
                platform, you accept and agree to be bound by the terms and
                provision of this agreement. If you do not agree to abide by the
                terms of this agreement, you are not authorized to use or access
                this platform.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                2. Description of Services
              </h3>
              <p>
                Tutor Nomor Satu provides an online learning platform that
                connects students with qualified tutors for semi-private and
                private tutoring sessions. Our services include:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Live online tutoring sessions</li>
                <li>Access to learning materials and resources</li>
                <li>Assignments and quizzes for practice</li>
                <li>Progress tracking and reporting</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                3. User Accounts
              </h3>
              <p>
                To access certain features of the platform, you must register
                for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  Provide accurate and complete information during registration
                </li>
                <li>Maintain the security of your password and account</li>
                <li>
                  Notify us immediately of any unauthorized use of your account
                </li>
                <li>
                  Accept responsibility for all activities under your account
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                4. Payment Terms
              </h3>
              <p>
                All payments for tutoring services are processed securely
                through our payment partners. By making a payment, you agree to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Pay the fees associated with your selected program</li>
                <li>Subscription periods of 30 days with 8 meeting quota</li>
                <li>Refund policies as outlined in our refund policy</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                5. User Conduct
              </h3>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Use the platform for any unlawful purpose</li>
                <li>Share your account credentials with others</li>
                <li>Harass, abuse, or harm other users or tutors</li>
                <li>Upload or share inappropriate content</li>
                <li>Attempt to hack or disrupt the platform</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                6. Intellectual Property
              </h3>
              <p>
                All content on the platform, including but not limited to text,
                graphics, logos, videos, and software, is the property of Tutor
                Nomor Satu or its content suppliers and is protected by
                copyright laws.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                7. Limitation of Liability
              </h3>
              <p>
                Tutor Nomor Satu shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages
                resulting from your access to or use of, or inability to access
                or use, the platform.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                8. Termination
              </h3>
              <p>
                We may terminate or suspend your account immediately, without
                prior notice, for conduct that we believe violates these Terms
                of Service or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                9. Changes to Terms
              </h3>
              <p>
                We reserve the right to modify these terms at any time. We will
                notify users of any material changes via email or through the
                platform. Continued use of the platform after changes
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                10. Contact Us
              </h3>
              <p>
                If you have any questions about these Terms of Service, please
                contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> support@tutornomorsatu.com
                <br />
                <strong>Phone:</strong> +62 812-3456-7890
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
