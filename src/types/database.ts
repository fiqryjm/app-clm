export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ContractType = 'SALES' | 'SUPPLIER'
export type ContractStatus = 'REQUEST' | 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'

export interface Contract {
  id: string
  contract_id: string
  contract_type: ContractType
  contract_title: string
  cost_center: string | null
  requisition_no: string | null
  date_request: string | null
  date_entry: string | null
  start_date: string | null
  end_date: string | null
  expiry_reminder_date: string | null
  status: ContractStatus
  counterpart_name: string | null
  counterpart_id: string | null
  address: string | null
  phone: string | null
  email: string | null
  used_of_contract: string | null
  type_of_contract: string | null
  contract_brief_summary: string | null
  location_of_work: string | null
  bom_scope_of_work: string | null
  currency: string
  owner_estimate: number | null
  total_contract_value: number | null
  end_user_name: string | null
  end_user_department: string | null
  approved_by: string | null
  contract_manager: string | null
  contract_manager_department: string | null
  company_approving_person: string | null
  counterpart_approving_person: string | null
  company_representative: string | null
  counterpart_representative: string | null
  company_rep_phone: string | null
  company_rep_email: string | null
  counterpart_rep_phone: string | null
  counterpart_rep_email: string | null
  initial_contract_value: number | null
  total_variation_order: number | null
  final_cost: number | null
  initial_variation_budget: number | null
  total_variation_budget: number | null
  final_budget: number | null
  created_at: string
  updated_at: string
}

export interface ContractLineItem {
  id: string
  contract_id: string
  item_no: number
  description: string | null
  contract_value: number | null
  budget: number | null
  created_at: string
}

export interface VariationOrder {
  id: string
  contract_id: string
  item_no: number
  description: string | null
  value: number | null
  budget: number | null
  completion_date: string | null
  created_at: string
}

export interface ProgressPayment {
  id: string
  contract_id: string
  item_no: number
  date: string | null
  budget: number | null
  contract_value: number | null
  progress_delivery_pct: number | null
  cumulative_payment: number | null
  payment: number | null
  created_at: string
}

export interface Milestone {
  id: string
  contract_id: string
  item_no: number
  initial_deadline_date: string | null
  actual_completion: string | null
  milestones_description: string | null
  remarks: string | null
  created_at: string
}

export interface AttachedDocument {
  id: string
  contract_id: string
  item_no: number
  document_type: string | null
  description: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  created_at: string
}

export interface RiskRegister {
  id: string
  contract_id: string
  item_no: number
  issue: string | null
  likelihood_rating: number | null
  impact_rating: number | null
  overall_risk_score: number | null
  mitigation: string | null
  proposed_solution: string | null
  created_at: string
}

export interface FinalDeliverable {
  id: string
  contract_id: string
  item_no: number
  description: string | null
  created_at: string
}

// Database type for Supabase
export interface Database {
  public: {
    Tables: {
      contracts: {
        Row: Contract
        Insert: Omit<Contract, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contract, 'id' | 'created_at' | 'updated_at'>>
      }
      contract_line_items: {
        Row: ContractLineItem
        Insert: Omit<ContractLineItem, 'id' | 'created_at'>
        Update: Partial<Omit<ContractLineItem, 'id' | 'created_at'>>
      }
      variation_orders: {
        Row: VariationOrder
        Insert: Omit<VariationOrder, 'id' | 'created_at'>
        Update: Partial<Omit<VariationOrder, 'id' | 'created_at'>>
      }
      progress_payments: {
        Row: ProgressPayment
        Insert: Omit<ProgressPayment, 'id' | 'created_at'>
        Update: Partial<Omit<ProgressPayment, 'id' | 'created_at'>>
      }
      milestones: {
        Row: Milestone
        Insert: Omit<Milestone, 'id' | 'created_at'>
        Update: Partial<Omit<Milestone, 'id' | 'created_at'>>
      }
      attached_documents: {
        Row: AttachedDocument
        Insert: Omit<AttachedDocument, 'id' | 'created_at'>
        Update: Partial<Omit<AttachedDocument, 'id' | 'created_at'>>
      }
      risks_register: {
        Row: RiskRegister
        Insert: Omit<RiskRegister, 'id' | 'created_at'>
        Update: Partial<Omit<RiskRegister, 'id' | 'created_at'>>
      }
      final_deliverables: {
        Row: FinalDeliverable
        Insert: Omit<FinalDeliverable, 'id' | 'created_at'>
        Update: Partial<Omit<FinalDeliverable, 'id' | 'created_at'>>
      }
    }
  }
}
