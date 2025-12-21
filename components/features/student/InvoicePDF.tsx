"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
  },
  invoiceNumber: {
    fontSize: 12,
    marginTop: 5,
    fontFamily: "Courier",
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
  },
  companyTagline: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "right",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6b7280",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    color: "#6b7280",
  },
  value: {
    fontWeight: "bold",
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottom: "1px solid #f3f4f6",
  },
  tableColDescription: {
    width: "70%",
  },
  tableColAmount: {
    width: "30%",
    textAlign: "right",
  },
  tableHeaderText: {
    fontWeight: "bold",
    fontSize: 10,
  },
  totalRow: {
    flexDirection: "row",
    marginTop: 15,
    paddingTop: 10,
    borderTop: "2px solid #2563eb",
  },
  totalLabel: {
    width: "70%",
    fontSize: 14,
    fontWeight: "bold",
  },
  totalValue: {
    width: "30%",
    textAlign: "right",
    fontSize: 14,
    fontWeight: "bold",
    color: "#2563eb",
  },
  statusBadge: {
    padding: "4 10",
    borderRadius: 4,
    fontSize: 9,
    fontWeight: "bold",
  },
  statusPaid: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPending: {
    backgroundColor: "#fef9c3",
    color: "#854d0e",
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: "1px solid #e5e7eb",
    textAlign: "center",
    color: "#6b7280",
    fontSize: 9,
  },
  infoGrid: {
    flexDirection: "row",
    marginBottom: 20,
  },
  infoColumn: {
    width: "50%",
  },
});

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  status: string;
  createdAt: string;
  dueDate: string;
  paidAt: string | null;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  programName: string;
  sectionLabel: string;
  tutorName: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  discount: number;
  totalAmount: number;
  notes: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  enrollmentId: string;
}

interface InvoicePDFProps {
  invoice: InvoiceData;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export function InvoicePDF({ invoice }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
          <View>
            <Text style={styles.companyName}>Tutor Nomor Satu</Text>
            <Text style={styles.companyTagline}>Platform E-Learning</Text>
          </View>
        </View>

        {/* Status & Dates */}
        <View style={styles.row}>
          <View>
            <Text
              style={[
                styles.statusBadge,
                invoice.status === "PAID"
                  ? styles.statusPaid
                  : styles.statusPending,
              ]}
            >
              {invoice.status === "PAID" ? "LUNAS" : "MENUNGGU PEMBAYARAN"}
            </Text>
            {invoice.paidAt && (
              <Text style={{ marginTop: 5, fontSize: 9 }}>
                Dibayar: {formatDate(invoice.paidAt)}
              </Text>
            )}
          </View>
          <View style={{ textAlign: "right" }}>
            <Text>Tanggal: {formatDate(invoice.createdAt)}</Text>
            <Text style={styles.label}>
              Jatuh Tempo: {formatDate(invoice.dueDate)}
            </Text>
          </View>
        </View>

        {/* Bill To & Program Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>Ditagihkan Kepada</Text>
            <Text style={styles.value}>{invoice.studentName}</Text>
            <Text style={styles.label}>{invoice.studentEmail}</Text>
            {invoice.studentPhone && (
              <Text style={styles.label}>{invoice.studentPhone}</Text>
            )}
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>Detail Program</Text>
            <Text style={styles.value}>{invoice.programName}</Text>
            <Text style={styles.label}>
              Section {invoice.sectionLabel} • Tutor: {invoice.tutorName}
            </Text>
            <Text style={styles.label}>
              Periode: {formatDate(invoice.periodStart)} -{" "}
              {formatDate(invoice.periodEnd)}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableColDescription]}>
              Deskripsi
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableColAmount]}>
              Jumlah
            </Text>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableColDescription}>
              <Text style={styles.value}>{invoice.programName}</Text>
              <Text style={styles.label}>
                Biaya bulanan - Section {invoice.sectionLabel}
              </Text>
            </View>
            <Text style={styles.tableColAmount}>
              {formatPrice(invoice.amount)}
            </Text>
          </View>
          {invoice.discount > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableColDescription, { color: "#16a34a" }]}>
                Diskon
              </Text>
              <Text style={[styles.tableColAmount, { color: "#16a34a" }]}>
                -{formatPrice(invoice.discount)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatPrice(invoice.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catatan</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Terima kasih atas kepercayaan Anda!</Text>
          <Text>
            Jika ada pertanyaan, silakan hubungi admin@tutornomorsatu.com
          </Text>
        </View>
      </Page>
    </Document>
  );
}
