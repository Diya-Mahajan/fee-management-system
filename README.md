# GROVER PT COLLEGE — Fee Management System

## Payment workflow
1. Teacher adds a student.
2. Teacher can open **Add Payment** as many times as needed for the same student.
3. Every payment gets its own `PAY-xxxxx` ID and stays **Pending**.
4. Pending payments appear in **Teacher → Pending Approvals** and **Sir → Payment Approvals**.
5. Teacher can edit a pending payment before Sir reviews it.
6. Sir can approve/reject the payment.
7. Only approved payments are added to the student's paid amount and official Fee History.
8. Sir's Fee Summary updates from approved payments.

## Student editing
Teacher can open All Students or a department page and use the edit icon to update student details, course, fee, diary page and photo.

## Login
Teacher: `teacher / teacher123`
Sir: `sir / sir123`

## Run
```powershell
npm install
npm run dev
```
