import ResetPassword from "./ResetPassword";
import { supabase } from "./supabase";
import React, { useMemo, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import {
  ArrowRight, ShieldCheck, UserRound, GraduationCap, LockKeyhole,
  Users, IndianRupee, LayoutDashboard, UserPlus, ReceiptText,
  History, CheckCircle2, Clock3, LogOut, Search, Eye, Trash2,
  Upload, X, CreditCard, BookOpen, Menu, Settings2, RefreshCw, Bell, CalendarDays, AlertCircle
} from "lucide-react";
import {
  COMPUTER_COURSES, DEPARTMENTS, OTHER_COURSES, getCategory,
  getToday, getStudents, saveStudents, getPayments, savePayments,
  generateStudentId, generatePaymentId, money,
  getCredentials, saveCredentials, exportFeeDataToExcel
} from "./data";
const SESSION_KEY = "feeSystemSession";

function useSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function Layout({ role, children }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const teacher = role === "teacher";

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    navigate("/login");
  };

  const links = teacher
  ? [
      ["/teacher-dashboard", "Dashboard", LayoutDashboard],
      ["/teacher/add-student", "Add Student", UserPlus],
      ["/teacher/students", "All Students", Users],
      ["/teacher/students/computer", "Computer Students", BookOpen],
      ["/teacher/students/pte", "PTE Students", GraduationCap],
      ["/teacher/students/ielts", "IELTS Students", GraduationCap],
      ["/teacher/students/spoken-english", "Spoken Students", UserRound],
      ["/teacher/payment-entry", "Add Payment", CreditCard],
      ["/teacher/pending", "Pending Approvals", Clock3],
      ["/teacher/fee-summary", "Fee Summary", IndianRupee],
      ["/teacher/fee-reminders", "Fee Reminders", Bell],
      ["/teacher/payment-history", "Fee History", History],
      ["/teacher/settings", "Settings", Settings2],
    ]
  : [
      ["/sir-dashboard", "Dashboard", LayoutDashboard],
      ["/sir/students", "All Students", Users],
      ["/sir/students/computer", "Computer Students", BookOpen],
      ["/sir/students/pte", "PTE Students", GraduationCap],
      ["/sir/students/ielts", "IELTS Students", GraduationCap],
      ["/sir/students/spoken-english", "Spoken Students", UserRound],
      ["/sir/approvals", "Payment Approvals", CheckCircle2],
      ["/sir/fee-summary", "Fee Summary", IndianRupee],
      ["/sir/fee-reminders", "Fee Reminders", Bell],
      ["/sir/payment-history", "Fee History", History],
      ["/sir/settings", "Settings", Settings2],
    ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="side-brand">
          <div className="brand-icon"><IndianRupee size={19}/></div>
          <div><b>GROVER PT COLLEGE</b><small>Fee Management System</small></div>
        </div>
        <div className="role-pill">{teacher ? "TEACHER ADMIN" : "SIR ADMIN"}</div>
        <nav>
          {links.map(([to,label,Icon]) => (
            <Link key={to} to={to} onClick={()=>setOpen(false)}>
              <Icon size={17}/><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-bottom">
          <button onClick={logout}><LogOut size={16}/> Logout</button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={()=>setOpen(!open)}><Menu size={20}/></button>
          <div><b>{teacher ? "Teacher Administration" : "Sir Administration"}</b><span>Fee Management System</span></div>
          <div className="top-role"><UserRound size={15}/>{teacher ? "Teacher" : "Sir"}</div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  return <div className="landing">
    <nav className="landing-nav">
      <div className="side-brand"><div className="brand-icon"><IndianRupee size={19}/></div><div><b>GROVER PT COLLEGE</b><small>Fee Management System</small></div></div>
      <button className="primary-btn" onClick={()=>navigate("/login")}>Admin Login <ArrowRight size={16}/></button>
    </nav>
    <section className="landing-hero">
      <div className="hero-chip"><ShieldCheck size={15}/> Secure two-level payment approval</div>
      <h1>Student & Fee Management<br/><span>Built around your workflow.</span></h1>
      <p>Teacher enters admissions and payments. Sir reviews and approves payments. Only approved payments become part of the official fee history.</p>
      <button className="primary-btn large" onClick={()=>navigate("/login")}>Open Management System <ArrowRight size={17}/></button>
      <div className="feature-row">
        <Feature icon={Users} title="Student Records" text="Admissions, photo, parents, contact, course and fee details."/>
        <Feature icon={Clock3} title="Approval Flow" text="Teacher payment entries remain pending until Sir approves them."/>
        <Feature icon={History} title="Fee History" text="Search by serial number, student name or course."/>
      </div>
    </section>
  </div>;
}

function Feature({icon:Icon,title,text}) {
  return <div className="feature-card"><Icon size={20}/><b>{title}</b><p>{text}</p></div>;
}
function SettingsPage({ role }) {
  const [credentials, setCredentials] = useState(getCredentials());
  const [username, setUsername] = useState(
    credentials[role]?.username || ""
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const save = e => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const updated = {
      ...credentials,
      [role]: {
        username: username.trim(),
        password: password
      }
    };

    saveCredentials(updated);
    setCredentials(updated);
    setPassword("");
    setConfirmPassword("");

    setMessage(
      "Login credentials updated successfully."
    );
  };

  return (
    <Page
      title="Account Settings"
      subtitle={`Change ${role === "teacher" ? "Teacher" : "Sir Admin"} username and password`}
    >
      <div className="panel form-panel">

        {message && (
          <div className="alert info">
            {message}
          </div>
        )}

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <div className="form-section-title">
          <Settings2 size={18} />

          <div>
            <b>Login Credentials</b>
            <span>
              Update your username and password
            </span>
          </div>
        </div>

        <form onSubmit={save}>

          <div className="form-grid">

            <Field label="Username">
              <input
                value={username}
                onChange={e =>
                  setUsername(e.target.value)
                }
                placeholder="Enter new username"
              />
            </Field>

            <Field label="New Password">
              <input
                type="password"
                value={password}
                onChange={e =>
                  setPassword(e.target.value)
                }
                placeholder="Enter new password"
              />
            </Field>

            <Field label="Confirm New Password">
              <input
                type="password"
                value={confirmPassword}
                onChange={e =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm new password"
              />
            </Field>

          </div>

          <div className="form-actions">

            <button
              type="submit"
              className="primary-btn"
            >
              <Settings2 size={16} />
              Save Login Details
            </button>

          </div>

        </form>

      </div>
    </Page>
  );
}
function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("teacher");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = e => {
    e.preventDefault();
    setError("");

    const credentials = getCredentials();
    const account = credentials[role];

    if (
      !account ||
      username.trim().toLowerCase() !== account.username.toLowerCase() ||
      password !== account.password
    ) {
      setError(
        `Invalid ${
          role === "teacher" ? "teacher" : "sir"
        } username or password.`
      );
      return;
    }

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        role,
        username: account.username,
        loginAt: new Date().toISOString()
      })
    );

    navigate(
      role === "teacher"
        ? "/teacher-dashboard"
        : "/sir-dashboard"
    );
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>

        <button
          type="button"
          className="back-link"
          onClick={() => navigate("/")}
        >
          ← Back
        </button>

        <div className="login-logo">
          <LockKeyhole size={22} />
        </div>

        <h1>Admin Login</h1>

        <p>
          Choose the account you want to access.
        </p>

        <div className="role-grid">

          <button
            type="button"
            className={
              role === "teacher"
                ? "role-card active"
                : "role-card"
            }
            onClick={() => {
              setRole("teacher");
              setUsername("");
              setPassword("");
              setError("");
            }}
          >
            <UserRound />

            <div>
              <b>Teacher</b>
              <span>
                Admissions & payment entry
              </span>
            </div>
          </button>

          <button
            type="button"
            className={
              role === "sir"
                ? "role-card active"
                : "role-card"
            }
            onClick={() => {
              setRole("sir");
              setUsername("");
              setPassword("");
              setError("");
            }}
          >
            <GraduationCap />

            <div>
              <b>Sir Admin</b>
              <span>
                Approval & fee management
              </span>
            </div>
          </button>

        </div>

        <label>Username</label>

        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Enter username"
          autoComplete="username"
        />

        <label>Password</label>

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter password"
          autoComplete="current-password"
        />

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="primary-btn full"
        >
          Continue as {role === "teacher" ? "Teacher" : "Sir"}
          <ArrowRight size={16} />
        </button>

      </form>
    </div>
  );
}

function Protected({role,children}) {
  const session = useSession();

  if (!session) return <Navigate to="/login" replace/>;

  if (session.role !== role) {
    return (
      <Navigate
        to={session.role==="teacher"?"/teacher-dashboard":"/sir-dashboard"}
        replace
      />
    );
  }

  return <Layout role={role}>{children}</Layout>;
}

function Stat({icon:Icon,label,value,sub}) {
  return <div className="stat">
    <div className="stat-icon"><Icon size={18}/></div>
    <div>
      <span>{label}</span>
      <b>{value}</b>
      {sub&&<small>{sub}</small>}
    </div>
  </div>;
}

function Dashboard({role}) {
  const navigate=useNavigate();
  const [tick,setTick]=useState(0);
  const students=getStudents(), payments=getPayments();
  const pending=payments.filter(p=>p.status==="pending");
  const approved=payments.filter(p=>p.status==="approved");
  const teacher=role==="teacher";
  const totalApproved=approved.reduce((a,p)=>a+Number(p.amount||0),0);
  const lastPayments=[...payments]
    .sort((a,b)=>new Date(b.submittedAt||0)-new Date(a.submittedAt||0))
    .slice(0,6);
  const monthly=buildMonthlyCollection(approved,6);
  const totalCourseFees=students.reduce((a,s)=>a+Number(s.totalFee||0),0);
  const totalPaid=students.reduce((a,s)=>a+Number(s.paidAmount||0),0);
  const totalBalance=Math.max(0,totalCourseFees-totalPaid);
  const feeReminders=getFeeReminders(students,payments);

  React.useEffect(()=>{
    const refresh=()=>setTick(v=>v+1);
    window.addEventListener("storage",refresh);
    const timer=setInterval(refresh,1200);

    return ()=>{
      window.removeEventListener("storage",refresh);
      clearInterval(timer);
    };
  },[]);

  return <Page
    title={teacher?"Teacher Dashboard":"Sir Admin Dashboard"}
    subtitle={
      teacher
        ?"Admissions, payment entry and payment status"
        :"Review payments, approvals and complete fee collection overview"
    }
  >
    <div className="stats-grid">
      <Stat icon={Users} label="Total Students" value={students.length}/>
      <Stat icon={Clock3} label="Pending Payments" value={pending.length}/>
      <Stat icon={CheckCircle2} label="Approved Payments" value={approved.length}/>
      <Stat icon={IndianRupee} label="Approved Collection" value={money(totalApproved)}/>
    </div>

    {!teacher && <section className="fee-overview-panel">
      <div className="panel-head">
        <div>
          <b>Fee Collection Overview</b>
          <span>Approved payments only</span>
        </div>

        <button
          className="small-btn"
          onClick={()=>navigate("/sir/fee-summary")}
        >
          Open Full Summary <ArrowRight size={14}/>
        </button>
      </div>

      <div className="fee-overview-top">
        <div><span>Total Course Fees</span><b>{money(totalCourseFees)}</b></div>
        <div><span>Total Collected</span><b>{money(totalPaid)}</b></div>
        <div><span>Remaining Balance</span><b>{money(totalBalance)}</b></div>
      </div>

      <div className="monthly-grid">
        {monthly.map(m=>
          <div className="month-card" key={m.key}>
            <span>{m.label}</span>
            <b>{money(m.amount)}</b>
            <small>{m.count} payment{m.count===1?"":"s"}</small>
          </div>
        )}
      </div>
    </section>}

    <section className="panel fee-reminder-panel">
      <div className="panel-head">
        <div>
          <b><Bell size={16}/> Fee Reminders</b>
          <span>Monthly fees due soon or already due</span>
        </div>
        <button
          className="small-btn"
          onClick={()=>navigate(teacher?"/teacher/fee-reminders":"/sir/fee-reminders")}
        >
          View All <ArrowRight size={14}/>
        </button>
      </div>

      <FeeReminderList reminders={feeReminders.slice(0,5)} compact/>
    </section>

    <div className="section-grid">
      <section className="panel">
        <div className="panel-head">
          <div><b>Quick Actions</b><span>Common tasks</span></div>
        </div>

        <div className="quick-grid">
          {teacher ? <>
            <Quick
              onClick={()=>navigate("/teacher/add-student")}
              icon={UserPlus}
              text="Add Student"
            />
            <Quick
              onClick={()=>navigate("/teacher/students")}
              icon={Users}
              text="All Students"
            />
            <Quick
              onClick={()=>navigate("/teacher/payment-entry")}
              icon={CreditCard}
              text="Enter Payment"
            />
            <Quick
              onClick={()=>navigate("/teacher/pending")}
              icon={Clock3}
              text={`Pending Approvals ${pending.length?`(${pending.length})`:""}`}
            />
          </> : <>
            <Quick
              onClick={()=>navigate("/sir/approvals")}
              icon={CheckCircle2}
              text={`Payment Approvals ${pending.length?`(${pending.length})`:""}`}
            />
            <Quick
              onClick={()=>navigate("/sir/fee-summary")}
              icon={IndianRupee}
              text="Fee Summary"
            />
            <Quick
              onClick={()=>navigate("/sir/students")}
              icon={Users}
              text="All Students"
            />
            <Quick
              onClick={()=>navigate("/sir/payment-history")}
              icon={History}
              text="Fee History"
            />
          </>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <b>{teacher?"Last Payment History":"Pending Payment Approvals"}</b>
            <span>{teacher?"Latest payment activity":"Teacher-submitted payments"}</span>
          </div>

          {teacher&&
            <button
              className="small-btn"
              onClick={()=>navigate("/teacher/payment-history")}
            >
              View History <ArrowRight size={14}/>
            </button>
          }
        </div>

        {teacher
          ? <PaymentActivityList payments={lastPayments}/>
          : <PaymentMiniList payments={pending.slice(-5).reverse()}/>
        }
      </section>
    </div>
  </Page>;
}

function getNextDueDate(student, payments) {
  const studentPayments = payments
    .filter(p =>
      p.studentId === student.studentId &&
      p.status === "approved" &&
      p.type === "Monthly"
    )
    .sort((a,b) =>
      new Date(b.approvedAt || b.submittedAt || 0) -
      new Date(a.approvedAt || a.submittedAt || 0)
    );

  const lastPaymentDate = studentPayments[0]
    ? new Date(studentPayments[0].approvedAt || studentPayments[0].submittedAt)
    : new Date(student.admissionDate || student.createdAt || new Date());

  if (Number.isNaN(lastPaymentDate.getTime())) return null;

  const year = lastPaymentDate.getFullYear();
  const month = lastPaymentDate.getMonth();
  const day = lastPaymentDate.getDate();

  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear += 1;
  }

  const lastDayOfNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
  const dueDay = Math.min(day, lastDayOfNextMonth);

  return new Date(nextYear, nextMonth, dueDay);
}

function getFeeReminders(students, payments, daysAhead=7) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(today);
  end.setDate(end.getDate() + daysAhead);

  return students
    .filter(student =>
      String(student.feeType || "Monthly").toLowerCase() === "monthly" &&
      Number(student.totalFee || 0) > Number(student.paidAmount || 0)
    )
    .map(student => {
      const dueDate = getNextDueDate(student, payments);
      if (!dueDate) return null;

      const due = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate()
      );

      const diffDays = Math.ceil((due - today) / 86400000);
      const status = diffDays < 0
        ? "Overdue"
        : diffDays === 0
          ? "Due Today"
          : "Upcoming";

      return {
        student,
        dueDate: due,
        diffDays,
        status
      };
    })
    .filter(Boolean)
    .filter(item => item.dueDate <= end || item.dueDate < today)
    .sort((a,b) => a.dueDate - b.dueDate || a.student.name.localeCompare(b.student.name));
}

function formatReminderDate(date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function FeeReminderList({reminders, compact=false}) {
  if (!reminders.length) {
    return <Empty text="No monthly fee reminders right now."/>;
  }

  return <div className="mini-list">
    {reminders.map(item => {
      const {student,dueDate,diffDays,status}=item;
      const statusClass = diffDays < 0 ? "rejected" : diffDays === 0 ? "pending" : "approved";
      const dayText = diffDays < 0
        ? `${Math.abs(diffDays)} day${Math.abs(diffDays)===1?"":"s"} overdue`
        : diffDays === 0
          ? "Due today"
          : `${diffDays} day${diffDays===1?"":"s"} left`;

      return <div className="mini-row" key={`${student.studentId}-${dueDate.toISOString()}`}>
        <div className="status-dot pending"></div>
        <div>
          <b>{student.name}</b>
          <span>
            {student.studentId} · {student.course} · Due {formatReminderDate(dueDate)}
          </span>
        </div>
        <span className={`badge ${statusClass}`}>
          {compact ? dayText : `${status} · ${dayText}`}
        </span>
      </div>;
    })}
  </div>;
}

function FeeReminders() {
  const [tick,setTick]=useState(0);
  const students=getStudents();
  const payments=getPayments();
  const reminders=getFeeReminders(students,payments,31);

  React.useEffect(()=>{
    const refresh=()=>setTick(v=>v+1);
    window.addEventListener("storage",refresh);
    window.addEventListener("fee:data-changed",refresh);
    const timer=setInterval(refresh,1200);

    return ()=>{
      window.removeEventListener("storage",refresh);
      window.removeEventListener("fee:data-changed",refresh);
      clearInterval(timer);
    };
  },[]);

  const overdue=reminders.filter(x=>x.diffDays<0).length;
  const today=reminders.filter(x=>x.diffDays===0).length;
  const upcoming=reminders.filter(x=>x.diffDays>0).length;

  return <Page
    title="Fee Reminders"
    subtitle="Monthly fee reminders automatically arranged date-wise"
    actions={
      <button className="ghost-btn" onClick={()=>setTick(v=>v+1)}>
        <RefreshCw size={15}/> Refresh
      </button>
    }
  >
    <div className="stats-grid summary-stats">
      <Stat icon={AlertCircle} label="Overdue" value={overdue}/>
      <Stat icon={Bell} label="Due Today" value={today}/>
      <Stat icon={CalendarDays} label="Next 31 Days" value={upcoming}/>
      <Stat icon={Users} label="Monthly Students" value={reminders.length}/>
    </div>

    <section className="panel fee-reminder-panel">
      <div className="panel-head">
        <div>
          <b><CalendarDays size={16}/> Date-wise Monthly Fee Reminders</b>
          <span>Students are calculated from their latest approved monthly payment date.</span>
        </div>
      </div>

      <FeeReminderList reminders={reminders}/>
    </section>
  </Page>;
}

function PaymentActivityList({payments}) {
  if(!payments.length) return <Empty text="No payment activity yet."/>;

  return <div className="mini-list">
    {payments.map(p=>
      <div className="mini-row payment-activity" key={p.paymentId}>
        <div className={`status-dot ${p.status}`}></div>
        <div>
          <b>{p.studentName}</b>
          <span>{p.paymentId} · {money(p.amount)} · {p.type}</span>
        </div>
        <span className={`badge ${p.status}`}>{p.status}</span>
      </div>
    )}
  </div>;
}

function buildMonthlyCollection(payments,count=6){
  const now=new Date();

  return Array.from({length:count},(_,i)=>{
    const d=new Date(
      now.getFullYear(),
      now.getMonth()-(count-1-i),
      1
    );

    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;

    const monthPayments=payments.filter(p=>{
      const dt=new Date(p.approvedAt||p.submittedAt);

      return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`===key;
    });

    return {
      key,
      label:d.toLocaleDateString("en-IN",{month:"short",year:"numeric"}),
      amount:monthPayments.reduce((a,p)=>a+Number(p.amount||0),0),
      count:monthPayments.length
    };
  });
}

function Quick({onClick,icon:Icon,text}) {
  return <button className="quick" onClick={onClick}>
    <Icon size={19}/>
    <span>{text}</span>
    <ArrowRight size={15}/>
  </button>;
}

function Page({title,subtitle,children,actions}) {
  return <div className="page">
    <div className="page-heading">
      <div>
        <span>FEE MANAGEMENT</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions}
    </div>
    {children}
  </div>;
}

function StudentMiniList({students}) {
  if(!students.length) return <Empty text="No students added yet." />;

  return <div className="mini-list">
    {students.map(s=>
      <div className="mini-row" key={s.id}>
        <Avatar student={s}/>
        <div>
          <b>{s.name}</b>
          <span>{s.studentId} · {s.course}</span>
        </div>
        <strong>{money(s.totalFee)}</strong>
      </div>
    )}
  </div>;
}

function PaymentMiniList({payments}) {
  if(!payments.length) return <Empty text="No pending payments." />;

  return <div className="mini-list">
    {payments.map(p=>
      <div className="mini-row" key={p.paymentId}>
        <div className="status-dot pending"></div>
        <div>
          <b>{p.studentName}</b>
          <span>{p.paymentId} · {money(p.amount)}</span>
        </div>
        <span className="badge pending">Pending</span>
      </div>
    )}
  </div>;
}

function Empty({text}) {
  return <div className="empty">{text}</div>;
}

function Avatar({student}) {
  return student.photo
    ? <img className="avatar" src={student.photo}/>
    : <div className="avatar">
        {(student.name||"?").charAt(0).toUpperCase()}
      </div>;
}

function AddStudent() {
  const navigate=useNavigate();

  const [form,setForm]=useState({
    name:"",
    fatherName:"",
    motherName:"",
    phone:"",
    alternatePhone:"",
    email:"",
    address:"",
    qualification:"",
    department:"Computer",
    course:"Basic",
    duration:"3 Months",
    feeType:"Monthly",
    totalFee:6000,
    admissionDate:getToday(),
    diaryPageNumber:"",
    notes:"",
    photo:""
  });

  const [message,setMessage]=useState("");
  const photoInputRef = useRef(null);

  const update=(k,v)=>setForm(f=>({...f,[k]:v}));

  const courses = form.department==="Computer"
    ? Object.entries(COMPUTER_COURSES).map(([name,fee])=>({name,fee}))
    : (OTHER_COURSES[form.department] || []);

  const chooseDepartment = dep => {
    const first=(
      dep==="Computer"
        ? Object.keys(COMPUTER_COURSES)[0]
        : OTHER_COURSES[dep]?.[0]?.name||dep
    );

    const fee=(
      dep==="Computer"
        ? COMPUTER_COURSES[first]
        : (OTHER_COURSES[dep]?.[0]?.fee||0)
    );

    setForm(f=>({
      ...f,
      department:dep,
      course:first,
      totalFee:fee
    }));
  };

  const photo = e => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = event => {
      const img = new Image();

      img.onload = () => {
        const MAX_SIZE = 900;

        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        const compressedPhoto = canvas.toDataURL(
          "image/jpeg",
          0.78
        );

        update("photo", compressedPhoto);

        setMessage("Student photo added successfully.");

        if (photoInputRef.current) {
          photoInputRef.current.value = "";
        }
      };

      img.onerror = () => {
        setMessage("Unable to read this photo. Please choose another image.");
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      setMessage("Unable to read the selected photo.");
    };

    reader.readAsDataURL(file);
  };

  const submit=e=>{
    e.preventDefault();
    setMessage("");

    if(!form.name.trim() || !/^\d{10}$/.test(form.phone)) {
      setMessage("Please enter student name and a valid 10 digit phone number.");
      return;
    }

    const students=getStudents();

    if(students.some(s=>s.phone===form.phone.trim())) {
      setMessage("This phone number is already registered.");
      return;
    }

    const studentId=generateStudentId(students);

    const student={
      ...form,
      id:Date.now(),
      studentId,
      serialNumber:studentId,
      name:form.name.trim(),
      fatherName:form.fatherName.trim(),
      motherName:form.motherName.trim(),
      phone:form.phone.trim(),
      category:getCategory(form.department),
      createdAt:new Date().toISOString(),
      paidAmount:0,
      balance:Number(form.totalFee||0)
    };

    saveStudents([...students,student]);

    setMessage(`Student added successfully. ID: ${studentId}`);

    setTimeout(
      ()=>navigate("/teacher/students"),
      700
    );
  };

  return <Page
    title="Add New Student"
    subtitle="Register a student with personal, course, fee and photo details"
    actions={
      <button
        className="ghost-btn"
        onClick={()=>navigate("/teacher/students")}
      >
        Back to Students
      </button>
    }
  >
    <form className="panel form-panel" onSubmit={submit}>

      {message && <div className="alert info">{message}</div>}

      <div className="form-section-title">
        <UserPlus size={18}/>
        <div>
          <b>Personal Details</b>
          <span>Student and parent information</span>
        </div>
      </div>

      <div className="form-grid">
        <Field label="Student Name *">
          <input
            value={form.name}
            onChange={e=>update("name",e.target.value)}
            placeholder="Enter student name"
          />
        </Field>

        <Field label="Father Name">
          <input
            value={form.fatherName}
            onChange={e=>update("fatherName",e.target.value)}
            placeholder="Father name"
          />
        </Field>

        <Field label="Mother Name">
          <input
            value={form.motherName}
            onChange={e=>update("motherName",e.target.value)}
            placeholder="Mother name"
          />
        </Field>

        <Field label="Phone Number *">
          <input
            inputMode="numeric"
            value={form.phone}
            onChange={e=>update(
              "phone",
              e.target.value.replace(/\D/g,"").slice(0,10)
            )}
            placeholder="10 digit mobile number"
          />
        </Field>

        <Field label="Alternate Phone">
          <input
            inputMode="numeric"
            value={form.alternatePhone}
            onChange={e=>update(
              "alternatePhone",
              e.target.value.replace(/\D/g,"").slice(0,10)
            )}
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={e=>update("email",e.target.value)}
          />
        </Field>

        <Field label="Qualification">
          <input
            value={form.qualification}
            onChange={e=>update("qualification",e.target.value)}
            placeholder="12th / Graduation"
          />
        </Field>

        <Field label="Admission Date">
          <input
            type="date"
            value={form.admissionDate}
            onChange={e=>update("admissionDate",e.target.value)}
          />
        </Field>

        <Field label="Diary Page Number">
          <input
            value={form.diaryPageNumber}
            onChange={e=>update("diaryPageNumber",e.target.value)}
            placeholder="Enter diary page number"
          />
        </Field>

        <Field label="Address" full>
          <textarea
            rows="3"
            value={form.address}
            onChange={e=>update("address",e.target.value)}
            placeholder="Complete address"
          />
        </Field>
      </div>

      <div className="form-section-title">
        <BookOpen size={18}/>
        <div>
          <b>Course & Fee</b>
          <span>Select department, course and payment type</span>
        </div>
      </div>

      <div className="form-grid">
        <Field label="Department *">
          <select
            value={form.department}
            onChange={e=>chooseDepartment(e.target.value)}
          >
            {DEPARTMENTS.map(d=>
              <option key={d}>{d}</option>
            )}
          </select>
        </Field>

        <Field label="Course *">
          <select
            value={form.course}
            onChange={e=>{
              const c=e.target.value;
              const item=courses.find(x=>x.name===c);
              update("course",c);
              if(item)update("totalFee",item.fee);
            }}
          >
            {courses.map(c=>
              <option key={c.name} value={c.name}>
                {c.name}{c.fee?` — ${money(c.fee)}`:""}
              </option>
            )}
          </select>
        </Field>

        <Field label="Duration">
          <select
            value={form.duration}
            onChange={e=>update("duration",e.target.value)}
          >
            <option>1 Month</option>
            <option>3 Months</option>
            <option>6 Months</option>
            <option>12 Months</option>
            <option>Custom</option>
          </select>
        </Field>

        <Field label="Fee Type">
          <select
            value={form.feeType}
            onChange={e=>update("feeType",e.target.value)}
          >
            <option>Monthly</option>
            <option>One-Time</option>
          </select>
        </Field>

        <Field label="Total Course Fee">
          <input
            type="number"
            min="0"
            value={form.totalFee}
            onChange={e=>update("totalFee",e.target.value)}
          />
        </Field>

        <div className="fee-highlight">
          <span>Official Fee</span>
          <b>{money(form.totalFee)}</b>
          <small>{form.feeType} · {form.duration}</small>
        </div>
      </div>

      <div className="form-section-title">
        <Upload size={18}/>
        <div>
          <b>Student Photo</b>
          <span>Optional photo, max 2 MB</span>
        </div>
      </div>

      <div className="photo-upload">
        <div className="photo-preview">
          {form.photo ? (
            <img
              src={form.photo}
              alt="Student"
            />
          ) : (
            <UserRound size={32}/>
          )}
        </div>

        <button
          type="button"
          className="upload-btn"
          onClick={() => photoInputRef.current?.click()}
        >
          <Upload size={15}/>
          Choose Photo
        </button>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          style={{display:"none"}}
          onChange={photo}
        />

        {form.photo && (
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              update("photo","");
              if (photoInputRef.current) {
                photoInputRef.current.value = "";
              }
            }}
            title="Remove photo"
          >
            <X size={15}/>
          </button>
        )}
      </div>

      <Field label="Notes">
        <textarea
          rows="3"
          value={form.notes}
          onChange={e=>update("notes",e.target.value)}
          placeholder="Additional notes"
        />
      </Field>

      <div className="form-actions">
        <button
          type="button"
          className="ghost-btn"
          onClick={()=>navigate("/teacher-dashboard")}
        >
          Cancel
        </button>

        <button className="primary-btn">
          <UserPlus size={16}/>
          Save Student
        </button>
      </div>
    </form>
  </Page>;
}

function Field({label,children,full}) {
  return <div className={`field ${full?"full":""}`}>
    <label>{label}</label>
    {children}
  </div>;
}

function Students({sir=false, department="All"}) {
  const [students,setStudents]=useState(getStudents());
  const [q,setQ]=useState("");
  const [selected,setSelected]=useState(null);
  const [editing,setEditing]=useState(null);
  const navigate=useNavigate();

  React.useEffect(()=>{
    const refresh=()=>setStudents(getStudents());

    window.addEventListener("fee:data-changed",refresh);
    window.addEventListener("storage",refresh);

    return ()=>{
      window.removeEventListener("fee:data-changed",refresh);
      window.removeEventListener("storage",refresh)
    };
  },[]);

  const filtered=useMemo(()=>students.filter(s=>{
    const deptOk=department==="All" || s.department===department;
    const x=q.toLowerCase().trim();

    if(!deptOk)return false;
    if(!x)return true;

    return [
      s.studentId,
      s.name,
      s.fatherName,
      s.phone,
      s.course,
      s.department,
      s.diaryPageNumber
    ].some(v=>
      String(v||"").toLowerCase().includes(x)
    );
  }),[students,q,department]);

  const remove=id=>{
    if(!window.confirm("Delete this student record?"))return;

    const next=students.filter(s=>s.id!==id);
    saveStudents(next);
    setStudents(next);
  };

  return <Page
    title={department!=="All" ? `${department} Students` : "All Students"}
    subtitle="Search by serial number, name, phone, course or diary page"
    actions={!sir&&
      <button
        className="primary-btn"
        onClick={()=>navigate("/teacher/add-student")}
      >
        <UserPlus size={15}/>
        New Student
      </button>
    }
  >
    <div className="toolbar">

      <div className="search">
        <Search size={16}/>

        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Search serial number, name, phone, course, diary page..."
        />

        {q&&
          <button onClick={()=>setQ("")}>
            <X size={14}/>
          </button>
        }
      </div>

      <div className="dept-filter">

        <button
          className={department==="All"?"active":""}
          onClick={()=>navigate(sir?"/sir/students":"/teacher/students")}
        >
          All
        </button>

        {DEPARTMENTS.map(d=>
          <button
            key={d}
            className={department===d?"active":""}
            onClick={()=>navigate(
              (sir?"/sir/students/":"/teacher/students/")+
              d.toLowerCase().replace(/ /g,"-")
            )}
          >
            {d}
          </button>
        )}
      </div>
    </div>

    <div className="panel table-panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>PHOTO</th>
              <th>SERIAL NO.</th>
              <th>STUDENT</th>
              <th>PARENT</th>
              <th>DEPARTMENT</th>
              <th>COURSE</th>
              <th>FEE</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(s=>
              <tr key={s.id}>
                <td><Avatar student={s}/></td>

                <td>
                  <b className="mono">{s.studentId}</b>
                </td>

                <td>
                  <b>{s.name}</b>
                  <span className="table-sub">{s.phone}</span>
                </td>

                <td>{s.fatherName||"—"}</td>

                <td>
                  <span className="badge">{s.department}</span>
                </td>

                <td>{s.course}</td>

                <td>
                  <b>{money(s.totalFee)}</b>
                  <span className="table-sub">
                    Paid {money(s.paidAmount)}
                  </span>
                </td>

                <td>
                  <div className="actions">
                    <button
                      className="icon-btn"
                      title="View"
                      onClick={()=>setSelected(s)}
                    >
                      <Eye size={15}/>
                    </button>

                    {!sir&&<>
                      <button
                        className="icon-btn"
                        title="Edit student"
                        onClick={()=>setEditing(s)}
                      >
                        <Settings2 size={15}/>
                      </button>

                      <button
                        className="icon-btn danger"
                        title="Delete"
                        onClick={()=>remove(s.id)}
                      >
                        <Trash2 size={15}/>
                      </button>
                    </>}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!filtered.length&&<Empty text="No students found."/>}
      </div>
    </div>

    {selected&&
      <StudentModal
        student={selected}
        onClose={()=>setSelected(null)}
        onEdit={!sir
          ?()=>{setSelected(null);setEditing(selected)}
          :null
        }
      />
    }

    {editing&&
      <EditStudentModal
        student={editing}
        onClose={()=>setEditing(null)}
        onSaved={()=>{
          setEditing(null);
          setStudents(getStudents())
        }}
      />
    }
  </Page>;
}

function StudentModal({student,onClose,onEdit}) {
  const payments=getPayments().filter(
    p=>p.studentId===student.studentId
  );

  const approved=payments.filter(
    p=>p.status==="approved"
  );

  return <div
    className="modal-backdrop"
    onClick={onClose}
  >
    <div
      className="modal"
      onClick={e=>e.stopPropagation()}
    >
      <div className="modal-head">
        <div>
          <span>STUDENT PROFILE</span>
          <h2>{student.name}</h2>
        </div>

        <button onClick={onClose}>
          <X/>
        </button>
      </div>

      <div className="profile-top">
        <Avatar student={student}/>

        <div>
          <b>{student.studentId}</b>
          <span>{student.department} · {student.course}</span>
        </div>
      </div>

      <div className="detail-grid">
        {[
          ["Father Name",student.fatherName],
          ["Mother Name",student.motherName],
          ["Phone",student.phone],
          ["Email",student.email],
          ["Address",student.address],
          ["Qualification",student.qualification],
          ["Fee Type",student.feeType],
          ["Admission Date",student.admissionDate],
          ["Diary Page",student.diaryPageNumber]
        ].map(([k,v])=>
          <div key={k}>
            <span>{k}</span>
            <b>{v||"Not provided"}</b>
          </div>
        )}
      </div>

      <div className="fee-summary">
        <span>Total Fee <b>{money(student.totalFee)}</b></span>
        <span>Paid <b>{money(student.paidAmount)}</b></span>
        <span>
          Balance
          <b>
            {money(
              Math.max(
                0,
                Number(student.totalFee||0)-
                Number(student.paidAmount||0)
              )
            )}
          </b>
        </span>
      </div>

      <div className="profile-actions">
        {onEdit&&
          <button
            className="primary-btn"
            onClick={onEdit}
          >
            <Settings2 size={15}/>
            Edit Student
          </button>
        }

        <button
          className="ghost-btn"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="student-payment-mini">
        <b>Payment Records</b>
        <span>
          {approved.length} approved ·{" "}
          {payments.filter(p=>p.status==="pending").length} pending ·{" "}
          {payments.length} total
        </span>
      </div>
    </div>
  </div>;
}

function EditStudentModal({student,onClose,onSaved}) {
  const [form,setForm]=useState({...student});
  const [message,setMessage]=useState("");

  const update=(k,v)=>setForm(f=>({...f,[k]:v}));

  const courses=form.department==="Computer"
    ? Object.entries(COMPUTER_COURSES).map(([name,fee])=>({name,fee}))
    :(OTHER_COURSES[form.department]||[]);

  const chooseDepartment=dep=>{
    const first=dep==="Computer"
      ?Object.keys(COMPUTER_COURSES)[0]
      :(OTHER_COURSES[dep]?.[0]?.name||dep);

    const fee=dep==="Computer"
      ?COMPUTER_COURSES[first]
      :(OTHER_COURSES[dep]?.[0]?.fee||0);

    setForm(f=>({
      ...f,
      department:dep,
      course:first,
      totalFee:fee
    }))
  };

  const photo=e=>{
    const file=e.target.files?.[0];

    if(!file)return;

    if(file.size>2*1024*1024){
      setMessage("Photo must be under 2 MB.");
      return
    }

    const reader=new FileReader();

    reader.onload=()=>update("photo",reader.result);
    reader.readAsDataURL(file)
  };

  const save=e=>{
    e.preventDefault();

    if(
      !form.name.trim() ||
      !/^[0-9]{10}$/.test(String(form.phone||""))
    ){
      setMessage("Enter student name and valid 10 digit phone number.");
      return
    }

    const students=getStudents();

    const next=students.map(s=>
      s.id===student.id
        ?{
          ...s,
          ...form,
          name:form.name.trim(),
          phone:String(form.phone),
          totalFee:Number(form.totalFee||0),
          balance:Math.max(
            0,
            Number(form.totalFee||0)-
            Number(s.paidAmount||0)
          )
        }
        :s
    );

    saveStudents(next);

    setMessage("Student details updated successfully.");

    setTimeout(onSaved,300)
  };

  return <div
    className="modal-backdrop"
    onClick={onClose}
  >
    <form
      className="modal edit-student-modal"
      onClick={e=>e.stopPropagation()}
      onSubmit={save}
    >
      <div className="modal-head">
        <div>
          <span>EDIT STUDENT</span>
          <h2>{student.studentId}</h2>
        </div>

        <button
          type="button"
          onClick={onClose}
        >
          <X/>
        </button>
      </div>

      {message&&<div className="alert info">{message}</div>}

      <div className="form-grid">

        <Field label="Student Name *">
          <input
            value={form.name||""}
            onChange={e=>update("name",e.target.value)}
          />
        </Field>

        <Field label="Father Name">
          <input
            value={form.fatherName||""}
            onChange={e=>update("fatherName",e.target.value)}
          />
        </Field>

        <Field label="Mother Name">
          <input
            value={form.motherName||""}
            onChange={e=>update("motherName",e.target.value)}
          />
        </Field>

        <Field label="Phone *">
          <input
            value={form.phone||""}
            onChange={e=>update(
              "phone",
              e.target.value.replace(/\D/g,"").slice(0,10)
            )}
          />
        </Field>

        <Field label="Alternate Phone">
          <input
            value={form.alternatePhone||""}
            onChange={e=>update("alternatePhone",e.target.value)}
          />
        </Field>

        <Field label="Email">
          <input
            value={form.email||""}
            onChange={e=>update("email",e.target.value)}
          />
        </Field>

        <Field label="Diary Page Number">
          <input
            value={form.diaryPageNumber||""}
            onChange={e=>update("diaryPageNumber",e.target.value)}
          />
        </Field>

        <Field label="Admission Date">
          <input
            type="date"
            value={form.admissionDate||""}
            onChange={e=>update("admissionDate",e.target.value)}
          />
        </Field>

        <Field label="Department">
          <select
            value={form.department||"Computer"}
            onChange={e=>chooseDepartment(e.target.value)}
          >
            {DEPARTMENTS.map(d=>
              <option key={d}>{d}</option>
            )}
          </select>
        </Field>

        <Field label="Course">
          <select
            value={form.course||""}
            onChange={e=>{
              const c=e.target.value;
              const item=courses.find(x=>x.name===c);

              update("course",c);

              if(item)update("totalFee",item.fee);
            }}
          >
            {courses.map(c=>
              <option key={c.name}>{c.name}</option>
            )}
          </select>
        </Field>

        <Field label="Fee Type">
          <select
            value={form.feeType||"Monthly"}
            onChange={e=>update("feeType",e.target.value)}
          >
            <option>Monthly</option>
            <option>One-Time</option>
          </select>
        </Field>

        <Field label="Total Course Fee">
          <input
            type="number"
            min="0"
            value={form.totalFee||0}
            onChange={e=>update("totalFee",e.target.value)}
          />
        </Field>

        <Field label="Address" full>
          <textarea
            rows="3"
            value={form.address||""}
            onChange={e=>update("address",e.target.value)}
          />
        </Field>
      </div>

      <div className="photo-upload">
        <div>
          {form.photo
            ?<img src={form.photo}/>
            :<UserRound size={32}/>
          }
        </div>

        <label className="upload-btn">
          <Upload size={15}/>
          Change Photo
          <input
            hidden
            type="file"
            accept="image/*"
            onChange={photo}
          />
        </label>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="ghost-btn"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          className="primary-btn"
          type="submit"
        >
          Save Changes
        </button>
      </div>
    </form>
  </div>;
}

function PaymentEntry() {
  const navigate=useNavigate();
  const students=getStudents();
  const [q,setQ]=useState("");
  const [student,setStudent]=useState(null);
  const [amount,setAmount]=useState("");
  const [type,setType]=useState("Monthly");
  const [note,setNote]=useState("");
  const [message,setMessage]=useState("");

  const find=()=>{
    const x=q.toLowerCase().trim();

    const s=students.find(v=>
      [
        v.studentId,
        v.name,
        v.course,
        v.phone
      ].some(a=>
        String(a||"").toLowerCase()===x
      )
      ||
      String(v.studentId||"")
        .toLowerCase()
        .includes(x)
    );

    setStudent(s||null);

    if(!s)
      setMessage(
        "Student not found. Search by serial number, name, course or phone."
      );
    else
      setMessage("");
  };

  const submit=e=>{
    e.preventDefault();
    setMessage("");

    if(!student||Number(amount)<=0){
      setMessage("Select a student and enter a valid amount.");
      return;
    }

    const payments=getPayments();

    const payment={
      paymentId:generatePaymentId(payments),
      studentId:student.studentId,
      studentName:student.name,
      course:student.course,
      amount:Number(amount),
      type,
      note,
      submittedBy:"Teacher",
      status:"pending",
      submittedAt:new Date().toISOString(),
      approvedAt:null
    };

    savePayments([...payments,payment]);

    setMessage(
      `Payment ${payment.paymentId} submitted to Sir for approval.`
    );

    setAmount("");
    setNote("");

    setTimeout(
      ()=>navigate("/teacher/pending"),
      800
    );
  };

  return <Page
    title="Enter Fee Payment"
    subtitle="Teacher enters payment; it stays pending until Sir approves it."
    actions={
      <button
        className="ghost-btn"
        onClick={()=>navigate("/teacher-dashboard")}
      >
        Back
      </button>
    }
  >
    <div className="panel form-panel">

      {message&&<div className="alert info">{message}</div>}

      <div className="search large-search">
        <Search size={17}/>

        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&find()}
          placeholder="Enter Student ID, name, course or phone"
        />

        <button
          type="button"
          className="primary-btn"
          onClick={find}
        >
          Find Student
        </button>
      </div>

      {student&&
        <div className="selected-student">
          <Avatar student={student}/>

          <div>
            <b>{student.name}</b>
            <span>{student.studentId} · {student.course}</span>
          </div>

          <strong>
            Balance:{" "}
            {money(
              Number(student.totalFee||0)-
              Number(student.paidAmount||0)
            )}
          </strong>
        </div>
      }

      <form onSubmit={submit}>
        <div className="form-grid">

          <Field label="Payment Amount *">
            <input
              type="number"
              min="1"
              value={amount}
              onChange={e=>setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </Field>

          <Field label="Payment Type">
            <select
              value={type}
              onChange={e=>setType(e.target.value)}
            >
              <option>Monthly</option>
              <option>One-Time</option>
            </select>
          </Field>

          <Field label="Note" full>
            <textarea
              value={note}
              onChange={e=>setNote(e.target.value)}
              placeholder="Payment note"
            />
          </Field>
        </div>

        <div className="form-actions">

          <button
            type="button"
            className="ghost-btn"
            onClick={()=>navigate("/teacher-dashboard")}
          >
            Cancel
          </button>

          <button
            className="primary-btn"
            disabled={!student}
          >
            <CreditCard size={16}/>
            Send for Approval
          </button>

        </div>
      </form>
    </div>
  </Page>;
}

function Pending({sir=false}) {
  const [payments,setPayments]=useState(getPayments());
  const [selected,setSelected]=useState(null);
  const [editing,setEditing]=useState(null);

  const pending=payments.filter(
    p=>p.status==="pending"
  );

  React.useEffect(()=>{
    const refresh=()=>setPayments(getPayments());

    window.addEventListener("storage",refresh);

    const timer=setInterval(
      refresh,
      1000
    );

    return ()=>{
      window.removeEventListener("storage",refresh);
      clearInterval(timer);
    };
  },[]);

  const approve=id=>{
    const now=new Date().toISOString();
    const all=getPayments();

    const p=all.find(
      x=>x.paymentId===id
    );

    if(!p || p.status!=="pending")return;

    const students=getStudents();

    const s=students.find(
      x=>x.studentId===p.studentId
    );

    if(s){
      s.paidAmount=
        Number(s.paidAmount||0)+
        Number(p.amount||0);

      s.balance=Math.max(
        0,
        Number(s.totalFee||0)-
        s.paidAmount
      );

      saveStudents(students);
    }

    const next=all.map(
      x=>x.paymentId===id
        ?{
          ...x,
          status:"approved",
          approvedAt:now,
          approvedBy:"Sir"
        }
        :x
    );

    savePayments(next);
    setPayments(next);
    setSelected(null);
  };

  const reject=id=>{
    if(!window.confirm("Reject this payment?"))return;

    const next=getPayments().map(
      x=>x.paymentId===id
        ?{
          ...x,
          status:"rejected",
          rejectedAt:new Date().toISOString(),
          rejectedBy:"Sir"
        }
        :x
    );

    savePayments(next);
    setPayments(next);
    setSelected(null);
  };

  return <Page
    title={sir?"Payment Approvals":"Pending Approvals"}
    subtitle={
      sir
        ?"Only Sir can approve or reject teacher-submitted payments."
        :"Payments submitted by you are waiting for Sir's approval."
    }
    actions={
      <button
        className="ghost-btn"
        onClick={()=>setPayments(getPayments())}
      >
        <RefreshCw size={15}/>
        Refresh
      </button>
    }
  >
    <div className="approval-banner">
      <div>
        <CheckCircle2 size={18}/>

        <div>
          <b>
            {pending.length} payment
            {pending.length===1?"":"s"} waiting for approval
          </b>

          <span>
            Teacher-submitted payments appear here automatically.
          </span>
        </div>
      </div>

      {sir&&<span className="live-dot">LIVE</span>}
    </div>

    <div className="panel table-panel">
      <div className="table-scroll">
        <table>

          <thead>
            <tr>
              <th>PAYMENT ID</th>
              <th>STUDENT</th>
              <th>COURSE</th>
              <th>AMOUNT</th>
              <th>TYPE</th>
              <th>SUBMITTED</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {pending.map(p=>
              <tr key={p.paymentId}>

                <td className="mono">
                  {p.paymentId}
                </td>

                <td>
                  <b>{p.studentName}</b>
                  <span className="table-sub">
                    {p.studentId}
                  </span>
                </td>

                <td>{p.course}</td>

                <td>
                  <b>{money(p.amount)}</b>
                </td>

                <td>{p.type}</td>

                <td>
                  {new Date(
                    p.submittedAt
                  ).toLocaleString("en-IN")}
                </td>

                <td>
                  <span className="badge pending">
                    Pending
                  </span>
                </td>

                <td>
                  <div className="actions">

                    {!sir&&
                      <button
                        className="small-btn"
                        onClick={()=>setEditing(p)}
                      >
                        Edit
                      </button>
                    }

                    {sir&&
                      <button
                        className="small-btn"
                        onClick={()=>setSelected(p)}
                      >
                        Review & Approve
                      </button>
                    }

                  </div>
                </td>

              </tr>
            )}
          </tbody>
        </table>

        {!pending.length&&
          <Empty text="No pending payments. New teacher payments will appear here."/>
        }
      </div>
    </div>

    {selected&&
      <div className="modal-backdrop">
        <div className="modal">

          <div className="modal-head">
            <div>
              <span>PAYMENT REVIEW</span>
              <h2>{selected.paymentId}</h2>
            </div>

            <button onClick={()=>setSelected(null)}>
              <X/>
            </button>
          </div>

          <div className="review-box">
            <b>{selected.studentName}</b>
            <span>
              {selected.studentId} · {selected.course}
            </span>
            <strong>{money(selected.amount)}</strong>
            <small>
              {selected.type} · Submitted by {selected.submittedBy} ·{" "}
              {new Date(selected.submittedAt).toLocaleString("en-IN")}
            </small>
          </div>

          <div className="form-actions">
            <button
              className="danger-btn"
              onClick={()=>reject(selected.paymentId)}
            >
              Reject
            </button>

            <button
              className="primary-btn"
              onClick={()=>approve(selected.paymentId)}
            >
              <CheckCircle2 size={16}/>
              Approve Payment
            </button>
          </div>
        </div>
      </div>
    }

    {editing&&
      <PendingPaymentEditor
        payment={editing}
        onClose={()=>setEditing(null)}
        onSaved={()=>{
          setEditing(null);
          setPayments(getPayments())
        }}
      />
    }
  </Page>;
}

function PendingPaymentEditor({payment,onClose,onSaved}) {
  const [amount,setAmount]=useState(
    String(payment.amount||"")
  );

  const [type,setType]=useState(
    payment.type||"Monthly"
  );

  const [note,setNote]=useState(
    payment.note||""
  );

  const save=e=>{
    e.preventDefault();

    if(Number(amount)<=0)return;

    const next=getPayments().map(
      p=>p.paymentId===payment.paymentId
        ?{
          ...p,
          amount:Number(amount),
          type,
          note,
          updatedAt:new Date().toISOString()
        }
        :p
    );

    savePayments(next);
    onSaved()
  };

  return <div
    className="modal-backdrop"
    onClick={onClose}
  >
    <form
      className="modal"
      onClick={e=>e.stopPropagation()}
      onSubmit={save}
    >

      <div className="modal-head">
        <div>
          <span>EDIT PENDING PAYMENT</span>
          <h2>{payment.paymentId}</h2>
        </div>

        <button
          type="button"
          onClick={onClose}
        >
          <X/>
        </button>
      </div>

      <div className="review-box">
        <b>{payment.studentName}</b>
        <span>
          {payment.studentId} · {payment.course}
        </span>
      </div>

      <div className="form-grid">

        <Field label="Payment Amount">
          <input
            type="number"
            min="1"
            value={amount}
            onChange={e=>setAmount(e.target.value)}
          />
        </Field>

        <Field label="Payment Type">
          <select
            value={type}
            onChange={e=>setType(e.target.value)}
          >
            <option>Monthly</option>
            <option>One-Time</option>
          </select>
        </Field>

        <Field label="Note" full>
          <textarea
            value={note}
            onChange={e=>setNote(e.target.value)}
          />
        </Field>

      </div>

      <div className="form-actions">

        <button
          type="button"
          className="ghost-btn"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          className="primary-btn"
          type="submit"
        >
          Save Payment
        </button>

      </div>
    </form>
  </div>;
}

function FeeSummary(){
  const [tick,setTick]=useState(0);
  const [q,setQ]=useState("");
  const [department,setDepartment]=useState("All");
  const [selected,setSelected]=useState(null);

  const students=getStudents();
  const allPayments=getPayments();

  const approvedPayments=allPayments.filter(
    p=>p.status==="approved"
  );

  const pendingPayments=allPayments.filter(
    p=>p.status==="pending"
  );

  React.useEffect(()=>{
    const refresh=()=>setTick(v=>v+1);

    window.addEventListener("storage",refresh);
    window.addEventListener("fee:data-changed",refresh);

    const timer=setInterval(refresh,1200);

    return ()=>{
      window.removeEventListener("storage",refresh);
      window.removeEventListener("fee:data-changed",refresh);
      clearInterval(timer);
    };
  },[]);

  const totalFees=students.reduce(
    (sum,s)=>sum+Number(s.totalFee||0),
    0
  );

  const totalCollected=approvedPayments.reduce(
    (sum,p)=>sum+Number(p.amount||0),
    0
  );

  const totalPending=pendingPayments.reduce(
    (sum,p)=>sum+Number(p.amount||0),
    0
  );

  const totalBalance=Math.max(
    0,
    totalFees-totalCollected
  );

  const monthly=buildMonthlyCollection(
    approvedPayments,
    12
  );

  const studentRows=students
    .map(student=>{

      const studentPayments=allPayments.filter(
        p=>p.studentId===student.studentId
      );

      const approved=studentPayments.filter(
        p=>p.status==="approved"
      );

      const pending=studentPayments.filter(
        p=>p.status==="pending"
      );

      const approvedPaid=approved.reduce(
        (sum,p)=>sum+Number(p.amount||0),
        0
      );

      const pendingAmount=pending.reduce(
        (sum,p)=>sum+Number(p.amount||0),
        0
      );

      const totalFee=Number(student.totalFee||0);

      const remaining=Math.max(
        0,
        totalFee-approvedPaid
      );

      const sortedApproved=[...approved].sort(
        (a,b)=>
          new Date(b.approvedAt||b.submittedAt||0) -
          new Date(a.approvedAt||a.submittedAt||0)
      );

      const lastPayment=sortedApproved[0];

      return {
        student,
        totalFee,
        approvedPaid,
        pendingAmount,
        remaining,
        approvedCount:approved.length,
        pendingCount:pending.length,
        lastPayment
      };
    })
    .filter(row=>{

      const text=q.trim().toLowerCase();

      const matchesSearch=
        !text ||
        [
          row.student.studentId,
          row.student.serialNumber,
          row.student.name,
          row.student.fatherName,
          row.student.phone,
          row.student.course,
          row.student.department,
          row.student.diaryPageNumber
        ].some(v=>
          String(v||"")
            .toLowerCase()
            .includes(text)
        );

      const matchesDepartment=
        department==="All" ||
        departmentOf(row.student)===department;

      return matchesSearch && matchesDepartment;
    });

  const openStudent=student=>{
    setSelected(student);
  };

  return (
    <Page
      title="Fee Summary"
      subtitle="Sir Admin — complete student-wise fee position and approved collection"
      actions={
        <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
          <button
            className="ghost-btn"
            onClick={()=>setTick(v=>v+1)}
          >
            <RefreshCw size={15}/>
            Refresh
          </button>
          <button
            className="ghost-btn"
            onClick={async()=>{
              try {
                await exportFeeDataToExcel();
              } catch (error) {
                console.error("Excel export error:", error);
                alert("Excel export failed. Please try again.");
              }
            }}
          >
            <ReceiptText size={15}/>
            Export to Excel
          </button>
        </div>
      }
    >

      <div className="stats-grid summary-stats">

        <Stat
          icon={IndianRupee}
          label="Total Course Fees"
          value={money(totalFees)}
        />

        <Stat
          icon={CheckCircle2}
          label="Total Collected"
          value={money(totalCollected)}
        />

        <Stat
          icon={Clock3}
          label="Remaining Balance"
          value={money(totalBalance)}
        />

        <Stat
          icon={ReceiptText}
          label="Pending Approval"
          value={money(totalPending)}
        />

      </div>

      <section className="panel fee-summary-panel">

        <div className="panel-head">
          <div>
            <b>Monthly Collection</b>
            <span>
              Only Sir-approved payments are counted
            </span>
          </div>
        </div>

        <div className="monthly-summary-grid">

          {monthly.map(m=>
            <div
              className="monthly-summary-card"
              key={m.key}
            >
              <span>{m.label}</span>
              <b>{money(m.amount)}</b>
              <small>
                {m.count} approved payment
                {m.count===1 ? "" : "s"}
              </small>
            </div>
          )}

        </div>
      </section>

      <section className="panel">

        <div className="panel-head">
          <div>
            <b>Student-wise Fee Details</b>
            <span>
              Complete fee position of every student
            </span>
          </div>

          <span className="muted-note">
            {studentRows.length} students
          </span>
        </div>

        <div className="toolbar">

          <div className="search">
            <Search size={16}/>

            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Search serial no., student name, phone, course or diary page..."
            />

            {q&&
              <button onClick={()=>setQ("")}>
                <X size={14}/>
              </button>
            }
          </div>

          <div className="dept-filter">

            <button
              className={department==="All" ? "active" : ""}
              onClick={()=>setDepartment("All")}
            >
              All
            </button>

            {DEPARTMENTS.map(d=>
              <button
                key={d}
                className={department===d ? "active" : ""}
                onClick={()=>setDepartment(d)}
              >
                {d}
              </button>
            )}

          </div>
        </div>

        <div className="table-panel">

          <div className="table-scroll">

            <table>

              <thead>
                <tr>
                  <th>SERIAL NO.</th>
                  <th>STUDENT</th>
                  <th>DEPARTMENT</th>
                  <th>COURSE</th>
                  <th>TOTAL FEE</th>
                  <th>PAID</th>
                  <th>PENDING</th>
                  <th>BALANCE</th>
                  <th>PAYMENTS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>

                {studentRows.map(row=>{

                  const s=row.student;

                  return (
                    <tr key={s.id}>

                      <td>
                        <b className="mono">
                          {s.studentId}
                        </b>
                      </td>

                      <td>
                        <b>{s.name}</b>
                        <span className="table-sub">
                          {s.phone || "No phone"}
                        </span>
                      </td>

                      <td>
                        <span className="badge">
                          {s.department}
                        </span>
                      </td>

                      <td>
                        {s.course || "—"}
                      </td>

                      <td>
                        <b>
                          {money(row.totalFee)}
                        </b>
                      </td>

                      <td>
                        <b className="paid-value">
                          {money(row.approvedPaid)}
                        </b>
                      </td>

                      <td>
                        {row.pendingAmount>0 ? (
                          <b className="pending-value">
                            {money(row.pendingAmount)}
                          </b>
                        ) : (
                          <span className="table-sub">
                            ₹0
                          </span>
                        )}
                      </td>

                      <td>
                        {row.remaining<=0 ? (
                          <span className="badge approved">
                            Fee Complete
                          </span>
                        ) : (
                          <b className="balance-value">
                            {money(row.remaining)}
                          </b>
                        )}
                      </td>

                      <td>
                        <span className="table-sub">
                          {row.approvedCount} approved
                        </span>

                        {row.pendingCount>0&&
                          <span className="table-sub">
                            {row.pendingCount} pending
                          </span>
                        }
                      </td>

                      <td>

                        <div className="table-actions">

                          <button
                            className="small-btn"
                            onClick={()=>openStudent(s)}
                          >
                            <Eye size={14}/>
                            Details
                          </button>

                          <button
                            className="small-btn delete-btn"
                            onClick={() => {

                              const ok = window.confirm(
                                `Delete ${s.name}'s student record?\n\nThis will remove the student from the system.`
                              );

                              if (!ok) return;

                              const nextStudents = students.filter(
                                student => student.id !== s.id
                              );

                              saveStudents(nextStudents);

                              window.dispatchEvent(
                                new Event("fee:data-changed")
                              );

                              setTick(v => v + 1);

                            }}
                          >
                            <Trash2 size={14}/>
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  );

                })}

              </tbody>

            </table>

            {!studentRows.length&&
              <Empty text="No students found."/>
            }

          </div>
        </div>
      </section>

      {selected&&
        <FeeStudentDetails
          student={selected}
          payments={allPayments}
          onClose={()=>setSelected(null)}
        />
      }

    </Page>
  );
}

function FeeStudentDetails({
  student,
  payments,
  onClose
}){

  const studentPayments=payments
    .filter(p=>p.studentId===student.studentId)
    .sort(
      (a,b)=>
        new Date(
          b.approvedAt ||
          b.submittedAt ||
          0
        ) -
        new Date(
          a.approvedAt ||
          a.submittedAt ||
          0
        )
    );

  const approved=studentPayments.filter(
    p=>p.status==="approved"
  );

  const pending=studentPayments.filter(
    p=>p.status==="pending"
  );

  const rejected=studentPayments.filter(
    p=>p.status==="rejected"
  );

  const totalFee=Number(student.totalFee||0);

  const paid=approved.reduce(
    (sum,p)=>sum+Number(p.amount||0),
    0
  );

  const pendingAmount=pending.reduce(
    (sum,p)=>sum+Number(p.amount||0),
    0
  );

  const balance=Math.max(
    0,
    totalFee-paid
  );

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >

      <div
        className="modal fee-detail-modal"
        onClick={e=>e.stopPropagation()}
      >

        <div className="modal-head">

          <div>
            <span>
              COMPLETE FEE RECORD
            </span>

            <h2>
              {student.name}
            </h2>
          </div>

          <button onClick={onClose}>
            <X/>
          </button>

        </div>

        <div className="profile-top">

          <Avatar student={student}/>

          <div>

            <b>
              {student.studentId}
            </b>

            <span>
              {student.department} · {student.course}
            </span>

          </div>

        </div>

        <div className="fee-detail-cards">

          <div>
            <span>Total Course Fee</span>
            <b>
              {money(totalFee)}
            </b>
          </div>

          <div>
            <span>Sir Approved Paid</span>
            <b className="paid-value">
              {money(paid)}
            </b>
          </div>

          <div>
            <span>Pending Approval</span>
            <b className="pending-value">
              {money(pendingAmount)}
            </b>
          </div>

          <div>
            <span>Remaining Balance</span>
            <b className="balance-value">
              {money(balance)}
            </b>
          </div>

        </div>

        <div className="detail-grid">

          {[
            ["Father Name",student.fatherName],
            ["Mother Name",student.motherName],
            ["Phone",student.phone],
            ["Alternate Phone",student.alternatePhone],
            ["Diary Page",student.diaryPageNumber],
            ["Fee Type",student.feeType],
            ["Admission Date",student.admissionDate],
            ["Qualification",student.qualification]
          ].map(([key,value])=>
            <div key={key}>
              <span>{key}</span>
              <b>
                {value || "Not provided"}
              </b>
            </div>
          )}

        </div>

        <div className="panel">

          <div className="panel-head">

            <div>
              <b>
                Payment History
              </b>

              <span>
                All payments for this student
              </span>
            </div>

          </div>

          {!studentPayments.length ? (
            <Empty text="No payment records yet."/>
          ) : (
            <div className="table-scroll">

              <table>

                <thead>
                  <tr>
                    <th>PAYMENT ID</th>
                    <th>DATE</th>
                    <th>AMOUNT</th>
                    <th>TYPE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>

                  {studentPayments.map(p=>
                    <tr key={p.paymentId}>

                      <td className="mono">
                        {p.paymentId}
                      </td>

                      <td>
                        {new Date(
                          p.approvedAt ||
                          p.submittedAt
                        ).toLocaleDateString("en-IN")}
                      </td>

                      <td>
                        <b>
                          {money(p.amount)}
                        </b>
                      </td>

                      <td>
                        {p.type}
                      </td>

                      <td>
                        <span
                          className={`badge ${p.status}`}
                        >
                          {p.status}
                        </span>
                      </td>

                    </tr>
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

        <div className="student-payment-mini">

          <b>
            Payment Summary
          </b>

          <span>
            {approved.length} approved ·{" "}
            {pending.length} pending ·{" "}
            {rejected.length} rejected ·{" "}
            {studentPayments.length} total
          </span>

        </div>

        <div className="profile-actions">

          <button
            className="ghost-btn"
            onClick={onClose}
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}

function PaymentHistory() {
  const [payments]=useState(getPayments());
  const students=getStudents();
  const [q,setQ]=useState("");
  const [type,setType]=useState("All");

  const approved=payments.filter(
    p=>p.status==="approved"
  );

  const filtered=approved.filter(p=>{
    const x=q.toLowerCase().trim();

    const searchOk=
      !x ||
      [
        p.studentId,
        p.studentName,
        p.course,
        p.paymentId
      ].some(v=>
        String(v||"")
          .toLowerCase()
          .includes(x)
      );

    return searchOk &&
      (type==="All"||p.type===type);
  });

  return <Page
    title="Fee History"
    subtitle="Search official approved payment history by serial number, name or course."
  >

    <div className="toolbar">

      <div className="search">

        <Search size={16}/>

        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Search serial number, student name or course..."
        />

      </div>

      <select
        value={type}
        onChange={e=>setType(e.target.value)}
      >
        <option>All</option>
        <option>Monthly</option>
        <option>One-Time</option>
      </select>

    </div>

    <div className="history-cards">

      {filtered.map(p=>
        <div
          className="history-card"
          key={p.paymentId}
        >

          <div>

            <span className="badge approved">
              Approved
            </span>

            <h3>{p.studentName}</h3>

            <p>
              {p.studentId} · {p.course}
            </p>

          </div>

          <div className="history-amount">
            <b>{money(p.amount)}</b>
            <span>{p.type}</span>
          </div>

          <div className="history-meta">

            <span>
              Payment ID <b>{p.paymentId}</b>
            </span>

            <span>
              Approved{" "}
              <b>
                {new Date(
                  p.approvedAt
                ).toLocaleDateString("en-IN")}
              </b>
            </span>

          </div>

        </div>
      )}

      {!filtered.length&&
        <div className="panel">
          <Empty text="No approved payment history found."/>
        </div>
      }

    </div>

    <div className="muted-note">
      {students.length} students · {approved.length} approved payment records
    </div>

  </Page>;
}

const DEPARTMENT_ORDER = [
  "Computer",
  "PTE",
  "IELTS",
  "Spoken English"
];

function departmentOf(student) {
  const d=String(
    student?.department ||
    student?.category ||
    ""
  ).toLowerCase();

  if(d.includes("computer")) return "Computer";
  if(d.includes("ielts")) return "IELTS";
  if(d.includes("spoken")) return "Spoken English";
  if(d.includes("pte")) return "PTE";

  return "Other";
}

function nextStudentSerial(students) {
  const max=(students||[]).reduce((m,s)=>{
    const raw=s?.studentId||s?.serialNumber||"";

    const n=Number(
      String(raw).match(/(\d+)/)?.[1]||0
    );

    return Math.max(m,n);
  },0);

  return `STD-${String(max+1).padStart(4,"0")}`;
}

function App() {
  return <Routes>

    <Route
      path="/"
      element={<Landing/>}
    />

    <Route
      path="/login"
      element={<Login/>}
    />

    <Route
      path="/reset-password"
      element={<ResetPassword/>}
    />

    <Route
      path="/teacher-dashboard"
      element={
        <Protected role="teacher">
          <Dashboard role="teacher"/>
        </Protected>
      }
    />
<Route
  path="/teacher/settings"
  element={
    <Protected role="teacher">
      <SettingsPage role="teacher" />
    </Protected>
  }
/>

<Route
  path="/sir/settings"
  element={
    <Protected role="sir">
      <SettingsPage role="sir" />
    </Protected>
  }
/>
    <Route
      path="/sir-dashboard"
      element={
        <Protected role="sir">
          <Dashboard role="sir"/>
        </Protected>
      }
    />

    <Route
      path="/teacher/add-student"
      element={
        <Protected role="teacher">
          <AddStudent/>
        </Protected>
      }
    />

    <Route
      path="/teacher/students"
      element={
        <Protected role="teacher">
          <Students/>
        </Protected>
      }
    />

    {DEPARTMENTS.map(d =>
      <Route
        key={`t-${d}`}
        path={`/teacher/students/${d.toLowerCase().replace(/ /g,"-")}`}
        element={
          <Protected role="teacher">
            <Students department={d}/>
          </Protected>
        }
      />
    )}

    <Route
      path="/sir/students"
      element={
        <Protected role="sir">
          <Students sir/>
        </Protected>
      }
    />

    {DEPARTMENTS.map(d =>
      <Route
        key={`s-${d}`}
        path={`/sir/students/${d.toLowerCase().replace(/ /g,"-")}`}
        element={
          <Protected role="sir">
            <Students sir department={d}/>
          </Protected>
        }
      />
    )}

    <Route
      path="/teacher/payment-entry"
      element={
        <Protected role="teacher">
          <PaymentEntry/>
        </Protected>
      }
    />

    <Route
      path="/teacher/pending"
      element={
        <Protected role="teacher">
          <Pending/>
        </Protected>
      }
    />

    <Route
      path="/sir/approvals"
      element={
        <Protected role="sir">
          <Pending sir/>
        </Protected>
      }
    />

    <Route
      path="/sir/fee-summary"
      element={
        <Protected role="sir">
          <FeeSummary/>
        </Protected>
      }
    />

    <Route
      path="/teacher/fee-summary"
      element={
        <Protected role="teacher">
          <FeeSummary/>
        </Protected>
      }
    />

    <Route
      path="/teacher/fee-reminders"
      element={
        <Protected role="teacher">
          <FeeReminders/>
        </Protected>
      }
    />

    <Route
      path="/sir/fee-reminders"
      element={
        <Protected role="sir">
          <FeeReminders/>
        </Protected>
      }
    />

    <Route
      path="/teacher/payment-history"
      element={
        <Protected role="teacher">
          <PaymentHistory/>
        </Protected>
      }
    />

    <Route
      path="/sir/payment-history"
      element={
        <Protected role="sir">
          <PaymentHistory/>
        </Protected>
      }
    />

    <Route
      path="*"
      element={<Navigate to="/" replace/>}
    />

  </Routes>;
}

export default App;