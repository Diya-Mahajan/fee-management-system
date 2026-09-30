import { supabase } from "./supabase";
import * as XLSX from "xlsx";

/* =========================================================
   COURSE DATA
========================================================= */

export const COMPUTER_COURSES = {
  "Basic": 6000,
  "Basic + Accounts": 12000,
  "Basic + Accounts + Advanced Excel": 18000,
  "DCA": 12000,
  "Graphic Designing Without Basics": 6000,
  "Graphic Designing With Basics": 9000,
  "Graphic Designing + Video Editing Without Basics": 12000,
  "Graphic Designing + Video Editing With Basics": 15000
};

export const OTHER_COURSES = {
  PTE: [
    { name: "PTE", fee: 0, duration: "Custom" }
  ],
  IELTS: [
    { name: "IELTS", fee: 0, duration: "Custom" }
  ],
  "Spoken English": [
    { name: "Spoken English", fee: 0, duration: "Custom" }
  ]
};

export const DEPARTMENTS = [
  "Computer",
  "PTE",
  "IELTS",
  "Spoken English"
];

/* =========================================================
   BASIC HELPERS
========================================================= */

export const getToday = () =>
  new Date().toISOString().slice(0, 10);

export function getCategory(department) {
  if (department === "Computer") return "computer";
  if (department === "PTE") return "pte";
  if (department === "IELTS") return "ielts";
  if (department === "Spoken English") return "spoken";
  return "other";
}

export function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

/* =========================================================
   LOCAL CACHE KEYS
   App.jsx currently expects synchronous functions.
   So localStorage is used as a fast cache while Supabase
   becomes the permanent database.
========================================================= */

const STUDENTS_CACHE = "fee_students_cache";
const PAYMENTS_CACHE = "fee_payments_cache";

/* =========================================================
   SAFE LOCAL STORAGE
========================================================= */

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Cache read error:", error);
    return [];
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Cache write error:", error);
  }
}

/* =========================================================
   STUDENTS
========================================================= */

/*
  IMPORTANT:
  App.jsx uses getStudents() synchronously.
  Therefore this returns local cached data immediately.

  At the same time, Supabase is refreshed in background.
*/

export function getStudents() {
  const cached = readCache(STUDENTS_CACHE);

  refreshStudentsFromSupabase();

  return cached;
}

/* Load latest students from Supabase */
export async function refreshStudentsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from("fee_students")
      .select("*")
      .order("updated_at", { ascending: true });

    if (error) {
      console.error("Supabase students fetch error:", error);
      return [];
    }

    const students = (data || []).map(row => {
      return row.data || {};
    });

    writeCache(STUDENTS_CACHE, students);

    window.dispatchEvent(
      new Event("fee:data-changed")
    );

    return students;
  } catch (error) {
    console.error("Students refresh error:", error);
    return [];
  }
}

/* =========================================================
   SAVE ALL STUDENTS
========================================================= */

export async function saveStudents(students) {
  const safeStudents = Array.isArray(students)
    ? students
    : [];

  /* Update local cache immediately */
  writeCache(STUDENTS_CACHE, safeStudents);

  try {
    /*
      First remove deleted students from Supabase.

      We compare current local IDs with database IDs.
    */

    const { data: existingRows, error: existingError } =
      await supabase
        .from("fee_students")
        .select("id");

    if (existingError) {
      console.error(
        "Existing students fetch error:",
        existingError
      );
    }

    const currentIds = new Set(
      safeStudents.map(student =>
        Number(student.id)
      )
    );

    if (!existingError && existingRows) {
      const deletedIds = existingRows
        .map(row => Number(row.id))
        .filter(id => !currentIds.has(id));

      if (deletedIds.length) {
        await supabase
          .from("fee_students")
          .delete()
          .in("id", deletedIds);
      }
    }

    /*
      Upsert current students.
    */

    if (safeStudents.length) {
      const rows = safeStudents.map(student => ({
        id: Number(student.id),
        student_id:
          student.studentId ||
          student.student_id ||
          "",
        data: student,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from("fee_students")
        .upsert(rows, {
          onConflict: "id"
        });

      if (error) {
        console.error(
          "Students Supabase save error:",
          error
        );
        throw error;
      }
    }

    window.dispatchEvent(
      new Event("fee:data-changed")
    );

    return safeStudents;
  } catch (error) {
    console.error("saveStudents error:", error);

    /*
      Local data remains available even if
      Supabase temporarily fails.
    */

    return safeStudents;
  }
}

/* =========================================================
   ADD SINGLE STUDENT
========================================================= */

export async function addStudent(student) {
  const students = getStudents();

  const next = [...students, student];

  await saveStudents(next);

  return student;
}

/* =========================================================
   UPDATE SINGLE STUDENT
========================================================= */

export async function updateStudent(id, updates) {
  const students = getStudents();

  const updated = students.map(student =>
    Number(student.id) === Number(id)
      ? {
          ...student,
          ...updates
        }
      : student
  );

  await saveStudents(updated);

  return updated.find(
    student => Number(student.id) === Number(id)
  );
}

/* =========================================================
   DELETE SINGLE STUDENT
========================================================= */

export async function deleteStudent(id) {
  const students = getStudents();

  const next = students.filter(
    student =>
      Number(student.id) !== Number(id)
  );

  await saveStudents(next);

  return true;
}

/* =========================================================
   PAYMENTS
========================================================= */

export function getPayments() {
  const cached = readCache(PAYMENTS_CACHE);

  refreshPaymentsFromSupabase();

  return cached;
}

/* Load latest payments from Supabase */
export async function refreshPaymentsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from("fee_payments")
      .select("*")
      .order("updated_at", {
        ascending: true
      });

    if (error) {
      console.error(
        "Supabase payments fetch error:",
        error
      );
      return [];
    }

    const payments = (data || []).map(row => {
      return row.data || {};
    });

    writeCache(
      PAYMENTS_CACHE,
      payments
    );

    window.dispatchEvent(
      new Event("fee:data-changed")
    );

    return payments;
  } catch (error) {
    console.error(
      "Payments refresh error:",
      error
    );

    return [];
  }
}
/* =========================================================
   SAVE ALL PAYMENTS
========================================================= */

export async function savePayments(payments) {
  const safePayments = Array.isArray(payments)
    ? payments
    : [];

  /* Local cache immediately */
  writeCache(
    PAYMENTS_CACHE,
    safePayments
  );

  try {
    /*
      Existing payment IDs
    */

    const {
      data: existingRows,
      error: existingError
    } = await supabase
      .from("fee_payments")
      .select("payment_id");

    if (existingError) {
      console.error(
        "Existing payments fetch error:",
        existingError
      );
    }

    const currentPaymentIds =
      new Set(
        safePayments.map(payment =>
          String(
            payment.paymentId ||
            payment.payment_id ||
            ""
          )
        )
      );

    /*
      Delete payments removed from app.
    */

    if (!existingError && existingRows) {
      const deletedIds =
        existingRows
          .map(row =>
            String(row.payment_id)
          )
          .filter(
            id =>
              !currentPaymentIds.has(id)
          );

      if (deletedIds.length) {
        await supabase
          .from("fee_payments")
          .delete()
          .in(
            "payment_id",
            deletedIds
          );
      }
    }

    /*
      Upsert payments.
    */

    if (safePayments.length) {
      const rows = safePayments.map(
        payment => ({
          payment_id:
            payment.paymentId ||
            payment.payment_id,

          data: payment,

          updated_at:
            new Date().toISOString()
        })
      );

      const { error } =
        await supabase
          .from("fee_payments")
          .upsert(rows, {
            onConflict:
              "payment_id"
          });

      if (error) {
        console.error(
          "Payments Supabase save error:",
          error
        );

        throw error;
      }
    }

    window.dispatchEvent(
      new Event("fee:data-changed")
    );

    return safePayments;
  } catch (error) {
    console.error(
      "savePayments error:",
      error
    );

    return safePayments;
  }
}

/* =========================================================
   ADD PAYMENT
========================================================= */

export async function addPayment(payment) {
  const payments = getPayments();

  const next = [
    ...payments,
    payment
  ];

  await savePayments(next);

  return payment;
}

/* =========================================================
   UPDATE PAYMENT
========================================================= */

export async function updatePayment(
  id,
  updates
) {
  const payments = getPayments();

  const updated =
    payments.map(payment => {
      const paymentId =
        payment.paymentId ||
        payment.payment_id;

      return String(paymentId) ===
        String(id)
        ? {
            ...payment,
            ...updates
          }
        : payment;
    });

  await savePayments(updated);

  return updated.find(payment => {
    const paymentId =
      payment.paymentId ||
      payment.payment_id;

    return String(paymentId) ===
      String(id);
  });
}

/* =========================================================
   DELETE PAYMENT
========================================================= */

export async function deletePayment(id) {
  const payments = getPayments();

  const next =
    payments.filter(payment => {
      const paymentId =
        payment.paymentId ||
        payment.payment_id;

      return String(paymentId) !==
        String(id);
    });

  await savePayments(next);

  return true;
}

/* =========================================================
   COURSES
========================================================= */

export async function getCourses() {
  try {
    const { data, error } =
      await supabase
        .from("courses")
        .select("*")
        .eq("active", true)
        .order("name");

    if (error) {
      console.error(
        "Get courses error:",
        error
      );
      return [];
    }

    return data || [];
  } catch (error) {
    console.error(
      "Courses error:",
      error
    );

    return [];
  }
}

/* =========================================================
   FEE HISTORY
========================================================= */

export async function getFeeHistory() {
  try {
    const { data, error } =
      await supabase
        .from("fee_history")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {
      console.error(
        "Get fee history error:",
        error
      );

      return [];
    }

    return data || [];
  } catch (error) {
    console.error(
      "Fee history error:",
      error
    );

    return [];
  }
}

export async function addFeeHistory(
  history
) {
  const { data, error } =
    await supabase
      .from("fee_history")
      .insert([history])
      .select()
      .single();

  if (error) {
    console.error(
      "Add fee history error:",
      error
    );

    throw error;
  }

  return data;
}

/* =========================================================
   PAYMENT ID
========================================================= */

export function generatePaymentId(
  payments
) {
  let max = 0;

  (payments || []).forEach(payment => {
    const value =
      payment.paymentId ||
      payment.payment_id ||
      "";

    const match =
      String(value).match(
        /(\d+)$/
      );

    if (match) {
      max = Math.max(
        max,
        Number(match[1])
      );
    }
  });

  return `PAY-${String(
    max + 1
  ).padStart(5, "0")}`;
}

/* =========================================================
   STUDENT ID
========================================================= */

export function generateStudentId(
  students
) {
  let max = 0;

  (students || []).forEach(
    student => {
      const value =
        student.studentId ||
        student.student_id ||
        student.serialNumber ||
        "";

      const match =
        String(value).match(
          /(\d+)$/
        );

      if (match) {
        max = Math.max(
          max,
          Number(match[1])
        );
      }
    }
  );

  return `STD-${String(
    max + 1
  ).padStart(4, "0")}`;
}

/* =========================================================
   APP.JSX COMPATIBILITY
========================================================= */

export async function saveStudentsCompat(
  students
) {
  return saveStudents(students);
}

export async function savePaymentsCompat(
  payments
) {
  return savePayments(payments);
}

/*
  Keep the exact function names
  your existing App.jsx uses.
*/

export {
  saveStudentsCompat as saveStudentsToSupabase,
  savePaymentsCompat as savePaymentsToSupabase
};
// ===============================
// LOGIN CREDENTIALS
// ===============================

const LOGIN_KEY = "feeSystemCredentials";

export const DEFAULT_CREDENTIALS = {
  teacher: {
    username: "Navpreet Kaur",
    password: "nav@123",
  },
  sir: {
    username: "Pawan Grover",
    password: "Pawan@123",
  },
};

export function getCredentials() {
  const saved = localStorage.getItem(LOGIN_KEY);

  if (!saved) {
    localStorage.setItem(
      LOGIN_KEY,
      JSON.stringify(DEFAULT_CREDENTIALS)
    );

    return DEFAULT_CREDENTIALS;
  }

  try {
    const credentials = JSON.parse(saved);

    // Migrate the old default credentials to the current credentials.
    if (
      credentials?.teacher?.username === "teacher" &&
      credentials?.teacher?.password === "teacher123"
    ) {
      credentials.teacher = {
        ...DEFAULT_CREDENTIALS.teacher
      };
    }

    if (
      credentials?.sir?.username === "sir" &&
      credentials?.sir?.password === "sir123"
    ) {
      credentials.sir = {
        ...DEFAULT_CREDENTIALS.sir
      };
    }

    localStorage.setItem(
      LOGIN_KEY,
      JSON.stringify(credentials)
    );

    return credentials;
  } catch {
    localStorage.setItem(
      LOGIN_KEY,
      JSON.stringify(DEFAULT_CREDENTIALS)
    );

    return DEFAULT_CREDENTIALS;
  }
}

export function saveCredentials(credentials) {
  localStorage.setItem(
    LOGIN_KEY,
    JSON.stringify(credentials)
  );
}

/* =========================================================
   EXCEL EXPORT
   Only used when the user clicks "Export to Excel".
   Reads the complete history directly from Supabase.
========================================================= */

export async function exportFeeDataToExcel() {
  const [studentsResult, paymentsResult] =
    await Promise.all([
      supabase
        .from("fee_students")
        .select("*")
        .order("updated_at", {
          ascending: true
        }),

      supabase
        .from("fee_payments")
        .select("*")
        .order("updated_at", {
          ascending: true
        }),
    ]);

  if (studentsResult.error) {
    throw studentsResult.error;
  }

  if (paymentsResult.error) {
    throw paymentsResult.error;
  }

  const students =
    (studentsResult.data || [])
      .map(row => row.data || {})
      .filter(Boolean);

  const payments =
    (paymentsResult.data || [])
      .map(row => row.data || {})
      .filter(Boolean);

  const approvedPayments =
    payments.filter(
      payment =>
        payment.status === "approved"
    );

  const pendingPayments =
    payments.filter(
      payment =>
        payment.status === "pending"
    );

  const rejectedPayments =
    payments.filter(
      payment =>
        payment.status === "rejected"
    );

  const studentRows =
    students.map(student => {
      const studentPayments =
        payments.filter(
          payment =>
            payment.studentId ===
            student.studentId
        );

      const approvedPaid =
        studentPayments
          .filter(
            payment =>
              payment.status ===
              "approved"
          )
          .reduce(
            (sum, payment) =>
              sum +
              Number(
                payment.amount || 0
              ),
            0
          );

      const pendingAmount =
        studentPayments
          .filter(
            payment =>
              payment.status ===
              "pending"
          )
          .reduce(
            (sum, payment) =>
              sum +
              Number(
                payment.amount || 0
              ),
            0
          );

      const totalFee =
        Number(
          student.totalFee || 0
        );

      return {
        "Student ID":
          student.studentId ||
          student.serialNumber ||
          "",

        "Student Name":
          student.name || "",

        "Father Name":
          student.fatherName || "",

        "Mother Name":
          student.motherName || "",

        "Department":
          student.department || "",

        "Course":
          student.course || "",

        "Phone":
          student.phone || "",

        "Alternate Phone":
          student.alternatePhone ||
          "",

        "Email":
          student.email || "",

        "Address":
          student.address || "",

        "Qualification":
          student.qualification || "",

        "Duration":
          student.duration || "",

        "Fee Type":
          student.feeType || "",

        "Total Fee":
          totalFee,

        "Paid":
          approvedPaid,

        "Pending Approval":
          pendingAmount,

        "Balance":
          Math.max(
            0,
            totalFee -
              approvedPaid
          ),

        "Admission Date":
          student.admissionDate ||
          "",

        "Diary Page Number":
          student.diaryPageNumber ||
          "",

        "Notes":
          student.notes || "",

        "Created At":
          student.createdAt || "",
      };
    });

  const paymentRows =
    payments.map(payment => ({
      "Payment ID":
        payment.paymentId ||
        payment.payment_id ||
        "",

      "Student ID":
        payment.studentId || "",

      "Student Name":
        payment.studentName || "",

      "Course":
        payment.course || "",

      "Amount":
        Number(
          payment.amount || 0
        ),

      "Type":
        payment.type || "",

      "Status":
        payment.status || "",

      "Note":
        payment.note || "",

      "Submitted By":
        payment.submittedBy || "",

      "Submitted At":
        payment.submittedAt || "",

      "Approved By":
        payment.approvedBy || "",

      "Approved At":
        payment.approvedAt || "",
    }));

  const approvedRows =
    approvedPayments.map(
      payment => ({
        "Payment ID":
          payment.paymentId ||
          payment.payment_id ||
          "",

        "Student ID":
          payment.studentId || "",

        "Student Name":
          payment.studentName || "",

        "Course":
          payment.course || "",

        "Amount":
          Number(
            payment.amount || 0
          ),

        "Type":
          payment.type || "",

        "Submitted By":
          payment.submittedBy || "",

        "Submitted At":
          payment.submittedAt || "",

        "Approved By":
          payment.approvedBy || "",

        "Approved At":
          payment.approvedAt || "",

        "Note":
          payment.note || "",
      })
    );

  const pendingRows =
    pendingPayments.map(
      payment => ({
        "Payment ID":
          payment.paymentId ||
          payment.payment_id ||
          "",

        "Student ID":
          payment.studentId || "",

        "Student Name":
          payment.studentName || "",

        "Course":
          payment.course || "",

        "Amount":
          Number(
            payment.amount || 0
          ),

        "Type":
          payment.type || "",

        "Submitted By":
          payment.submittedBy || "",

        "Submitted At":
          payment.submittedAt || "",

        "Note":
          payment.note || "",
      })
    );

  const rejectedRows =
    rejectedPayments.map(
      payment => ({
        "Payment ID":
          payment.paymentId ||
          payment.payment_id ||
          "",

        "Student ID":
          payment.studentId || "",

        "Student Name":
          payment.studentName || "",

        "Course":
          payment.course || "",

        "Amount":
          Number(
            payment.amount || 0
          ),

        "Type":
          payment.type || "",

        "Status":
          payment.status || "",

        "Submitted By":
          payment.submittedBy || "",

        "Submitted At":
          payment.submittedAt || "",

        "Note":
          payment.note || "",
      })
    );

  const totalFees =
    students.reduce(
      (sum, student) =>
        sum +
        Number(
          student.totalFee || 0
        ),
      0
    );

  const totalCollected =
    approvedPayments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.amount || 0
        ),
      0
    );

  const totalPending =
    pendingPayments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.amount || 0
        ),
      0
    );

  const summaryRows = [
    {
      "Summary":
        "Total Students",
      "Value":
        students.length
    },

    {
      "Summary":
        "Total Payments",
      "Value":
        payments.length
    },

    {
      "Summary":
        "Approved Payments",
      "Value":
        approvedPayments.length
    },

    {
      "Summary":
        "Pending Payments",
      "Value":
        pendingPayments.length
    },

    {
      "Summary":
        "Rejected Payments",
      "Value":
        rejectedPayments.length
    },

    {
      "Summary":
        "Total Course Fees",
      "Value":
        totalFees
    },

    {
      "Summary":
        "Total Collected",
      "Value":
        totalCollected
    },

    {
      "Summary":
        "Pending Approval Amount",
      "Value":
        totalPending
    },

    {
      "Summary":
        "Remaining Balance",
      "Value":
        Math.max(
          0,
          totalFees -
            totalCollected
        )
    },

    {
      "Summary":
        "Exported At",
      "Value":
        new Date().toISOString()
    },
  ];

  const workbook =
    XLSX.utils.book_new();

  const addSheet = (
    name,
    rows
  ) => {
    const sheet =
      XLSX.utils.json_to_sheet(
        rows.length
          ? rows
          : [
              {
                "No Data":
                  "No records found"
              }
            ]
      );

    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      name
    );
  };

  addSheet(
    "Students",
    studentRows
  );

  addSheet(
    "Payment History",
    paymentRows
  );

  addSheet(
    "Approved Payments",
    approvedRows
  );

  addSheet(
    "Pending Payments",
    pendingRows
  );

  addSheet(
    "Rejected Payments",
    rejectedRows
  );

  addSheet(
    "Fee Summary",
    summaryRows
  );
    const completeHistory = payments.map(payment => {
    const student = students.find(
      item => item.studentId === payment.studentId
    ) || {};

    return {
      "Payment ID": payment.paymentId || payment.payment_id || "",
      "Student ID": payment.studentId || "",
      "Student Name": payment.studentName || student.name || "",
      "Father Name": student.fatherName || "",
      "Department": student.department || "",
      "Course": payment.course || student.course || "",
      "Phone": student.phone || "",
      "Total Fee": Number(student.totalFee || 0),
      "Payment Amount": Number(payment.amount || 0),
      "Payment Type": payment.type || "",
      "Payment Status": payment.status || "",
      "Submitted By": payment.submittedBy || "",
      "Submitted At": payment.submittedAt || "",
      "Approved By": payment.approvedBy || "",
      "Approved At": payment.approvedAt || "",
      "Note": payment.note || "",
    };
  });

  addSheet("Complete History", completeHistory);

  const today = new Date();

  const date = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  XLSX.writeFile(
    workbook,
    `GROVER_PT_COLLEGE_Fee_History_${date}.xlsx`
  );

  return {
    students: students.length,
    payments: payments.length,
  };
}