import mongoose from 'mongoose';
import { IBaseFinancialEntry, createBaseFinancialEntrySchema } from './BaseFinancialEntry';

// ExpenseEntry type alias for the base financial entry
export type IExpenseEntry = IBaseFinancialEntry;

const ExpenseEntrySchema = createBaseFinancialEntrySchema();

export default mongoose.models.ExpenseEntry || mongoose.model<IExpenseEntry>('ExpenseEntry', ExpenseEntrySchema);
