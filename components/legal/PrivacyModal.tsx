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
import { Shield } from "lucide-react";

interface PrivacyModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PrivacyModal({
  trigger,
  open,
  onOpenChange,
}: PrivacyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy Policy
          </DialogTitle>
          <DialogDescription>Last updated: December 2024</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm text-muted-foreground">
            <section>
              <h3 className="font-semibold text-foreground mb-2">
                1. Introduction
              </h3>
              <p>
                Tutor Nomor Satu (&quot;we&quot;, &quot;our&quot;, or
                &quot;us&quot;) is committed to protecting your privacy. This
                Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our e-learning platform.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                2. Information We Collect
              </h3>
              <p className="mb-2">
                We collect information that you provide directly to us:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Account Information:</strong> Name, email address,
                  phone number, password
                </li>
                <li>
                  <strong>Profile Information:</strong> Grade level, school
                  name, parent information (for minors)
                </li>
                <li>
                  <strong>Payment Information:</strong> Payment method details
                  (processed securely by third-party providers)
                </li>
                <li>
                  <strong>Learning Data:</strong> Course progress, quiz scores,
                  assignment submissions
                </li>
                <li>
                  <strong>Communication:</strong> Messages sent through our
                  platform
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                3. How We Use Your Information
              </h3>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>
                  Send you technical notices, updates, and support messages
                </li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Personalize your learning experience</li>
                <li>Send promotional communications (with your consent)</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                4. Information Sharing
              </h3>
              <p>We may share your information in the following situations:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  <strong>With Tutors:</strong> To facilitate tutoring sessions
                </li>
                <li>
                  <strong>With Parents/Guardians:</strong> Progress reports for
                  students under 18
                </li>
                <li>
                  <strong>Service Providers:</strong> Third parties who perform
                  services on our behalf
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or
                  to protect our rights
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                5. Data Security
              </h3>
              <p>
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction. These measures
                include:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication mechanisms</li>
                <li>Regular security assessments</li>
                <li>Access controls and monitoring</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                6. Data Retention
              </h3>
              <p>
                We retain your personal information for as long as your account
                is active or as needed to provide you services. We may also
                retain and use your information to comply with legal
                obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                7. Your Rights
              </h3>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify inaccurate or incomplete data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                8. Cookies and Tracking
              </h3>
              <p>
                We use cookies and similar tracking technologies to track
                activity on our platform and hold certain information. You can
                instruct your browser to refuse all cookies or to indicate when
                a cookie is being sent.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                9. Children&apos;s Privacy
              </h3>
              <p>
                For users under 18 years of age, we require parental consent for
                account creation. Parents or guardians have the right to review,
                update, or delete their child&apos;s information by contacting
                us.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                10. Changes to This Policy
              </h3>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">
                11. Contact Us
              </h3>
              <p>
                If you have questions about this Privacy Policy, please contact
                us:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> privacy@tutornomorsatu.com
                <br />
                <strong>Phone:</strong> +62 812-3456-7890
                <br />
                <strong>Address:</strong> Jakarta, Indonesia
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
