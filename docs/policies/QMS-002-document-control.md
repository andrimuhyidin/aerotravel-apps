# QMS-002: Document Control

**Document ID:** QMS-002  
**Version:** 1.0  
**Effective Date:** January 4, 2026  
**Last Reviewed:** January 4, 2026  
**Next Review:** January 4, 2027  
**Owner:** Quality Manager  
**ISO Standard:** ISO 9001:2015 (Clause 7.5)

---

## 1. Purpose

To establish a systematic process for the creation, review, approval, distribution, storage, and control of documents and records within the Quality Management System (QMS).

---

## 2. Scope

This procedure applies to all QMS documents including:
- Policies and procedures
- Work instructions
- Forms and templates
- Quality records
- Technical specifications
- External documents (regulations, standards, contracts)

---

## 3. Definitions

- **Document**: Information and its supporting medium (paper or electronic)
- **Record**: Document providing evidence of activities performed or results achieved
- **Version Control**: System for tracking document revisions
- **Obsolete Document**: Document no longer current or valid
- **Master Document**: Approved, controlled version of a document

---

## 4. Document Classification

### 4.1 Document Types

| Level | Type | Examples | Approval Authority |
|-------|------|----------|-------------------|
| Level 1 | Policy | Quality Policy, Safety Policy | Executive Management |
| Level 2 | Procedure | Standard Operating Procedures | Department Head |
| Level 3 | Work Instruction | Task-specific instructions | Section Lead |
| Level 4 | Form/Template | Checklists, Forms | Process Owner |
| Level 5 | Record | Completed forms, logs | N/A |

### 4.2 Document Identification

Format: `[TYPE]-[NUMBER]-[TITLE]`

Examples:
- `QMS-001-quality-policy`
- `SOP-HR-001-employee-onboarding`
- `WI-OPS-003-trip-start-checklist`

---

## 5. Document Creation and Review

### 5.1 Creation Process

1. **Initiate**: Process owner identifies need for new document
2. **Draft**: Author prepares initial draft following template
3. **Review**: Subject matter experts review for accuracy
4. **Approve**: Approval authority reviews and approves
5. **Release**: Document control releases to affected users
6. **Train**: Relevant personnel trained on new document (if applicable)

### 5.2 Review Cycle

| Document Type | Review Frequency | Trigger for Interim Review |
|--------------|------------------|---------------------------|
| Policies | Annual | Regulatory change, significant process change |
| Procedures | Annual | Audit finding, process improvement |
| Work Instructions | Bi-annual | Equipment change, method improvement |
| Forms | As needed | User feedback, compliance requirement |

### 5.3 Version Control

Version numbering format: `X.Y`
- **X** (Major version): Significant changes requiring retraining
- **Y** (Minor version): Editorial changes, clarifications

Example: 1.0 → 1.1 (minor) → 2.0 (major)

---

## 6. Document Approval

### 6.1 Approval Authority Matrix

| Document Level | Primary Approver | Secondary Approver |
|---------------|------------------|-------------------|
| Policy (Level 1) | CEO / COO | Quality Manager |
| Procedure (Level 2) | Department Head | Quality Manager |
| Work Instruction (Level 3) | Section Lead | Department Head |
| Form (Level 4) | Process Owner | Section Lead |

### 6.2 Approval Evidence

All approvals shall be documented with:
- Approver name and title
- Approval date
- Electronic signature (preferred) or physical signature
- Comments (if any)

---

## 7. Document Distribution and Access

### 7.1 Distribution Methods

**Electronic Distribution (Primary)**:
- Document management system: `docs/` folder in repository
- Access via internal portal
- Email notification for critical updates

**Physical Distribution (Secondary)**:
- Printed copies for field operations (clearly marked "CONTROLLED COPY")
- Register of printed copies maintained

### 7.2 Access Control

- **Public Documents**: Available to all employees
- **Confidential Documents**: Access restricted by role
- **External Documents**: Controlled distribution to partners/suppliers

---

## 8. Document Storage and Retention

### 8.1 Electronic Storage

**Location**: Git repository `/docs` folder
- Version history maintained in Git
- Automatic backup daily
- Access logs maintained

### 8.2 Retention Periods

| Document Type | Retention Period | Disposition Method |
|--------------|------------------|-------------------|
| Quality Records | 7 years | Archive then destroy |
| Audit Reports | 10 years | Archive then destroy |
| Training Records | Duration of employment + 5 years | Archive then destroy |
| Customer Complaints | 3 years | Archive then destroy |
| Safety Incidents | Permanent | Archive |

---

## 9. Change Management

### 9.1 Change Request Process

1. **Initiate**: Submit change request form
2. **Assess**: Impact assessment by quality team
3. **Approve**: Change approval by document owner
4. **Implement**: Update document with tracked changes
5. **Review**: Final review before release
6. **Release**: Distribute updated document
7. **Train**: Training (if required)
8. **Verify**: Verify implementation

### 9.2 Emergency Changes

For urgent safety or regulatory compliance issues:
- Verbal approval from approval authority
- Immediate implementation
- Formal documentation within 24 hours

---

## 10. Obsolete Documents

### 10.1 Identification

Obsolete documents shall be:
- Marked as "OBSOLETE - Do Not Use"
- Removed from active use locations
- Archived with effective/obsolete dates
- Retained for reference period (3 years)

### 10.2 Archival

One copy of obsolete document retained for:
- Historical reference
- Audit purposes
- Legal requirements

---

## 11. External Documents

### 11.1 Types

- Regulatory standards (ISO, national regulations)
- Customer specifications
- Supplier documents
- Industry best practices

### 11.2 Control

- Register of external documents maintained
- Periodic review for currency
- Access provided to relevant personnel
- Updates monitored and implemented

---

## 12. Records Management

### 12.1 Record Characteristics

Quality records shall be:
- **Legible**: Clearly readable
- **Identifiable**: Linked to activity/product/service
- **Retrievable**: Easily accessible when needed
- **Protected**: From damage, loss, or unauthorized access

### 12.2 Record Retention

Electronic records:
- Database backups: Daily
- Long-term storage: Cloud archive
- Disaster recovery: Offsite backup

Physical records:
- Secure filing cabinets
- Climate-controlled storage
- Fire protection

---

## 13. Monitoring and Audit

### 13.1 Performance Indicators

- % documents reviewed on schedule: Target ≥ 95%
- Average review cycle time: Target ≤ 30 days
- Non-conformances related to document control: Target 0
- Document retrieval time: Target ≤ 5 minutes

### 13.2 Internal Audits

Document control shall be audited:
- Frequency: Semi-annually
- Scope: Random sample of documents
- Focus: Compliance with this procedure

---

## 14. Training

All personnel shall receive training on:
- Document control procedures
- Version control system
- Access and retrieval methods
- Change management process

Training records maintained per QMS-004.

---

## 15. Responsibilities

### 15.1 Quality Manager
- Overall responsibility for document control system
- Approval of this procedure
- Audit of document control compliance

### 15.2 Document Control Coordinator
- Day-to-day document control activities
- Version control maintenance
- Distribution management
- Archive management

### 15.3 Document Owners
- Content accuracy and currency
- Timely reviews and updates
- Approval of changes
- Training on document changes

### 15.4 All Employees
- Use current approved versions
- Report document issues
- Comply with document control requirements
- Maintain records properly

---

## 16. References

- ISO 9001:2015, Clause 7.5 (Documented Information)
- QMS-001: Quality Policy
- QMS-003: Change Management

---

## 17. Appendices

### Appendix A: Document Template
### Appendix B: Change Request Form
### Appendix C: Document Register Template
### Appendix D: Obsolete Document Log

---

## 18. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-04 | Quality Manager | Initial release |

---

## 19. Approval

**Approved by:**  
[Quality Manager]  
Date: January 4, 2026

**Reviewed by:**  
[Department Heads]  
Date: January 4, 2026

