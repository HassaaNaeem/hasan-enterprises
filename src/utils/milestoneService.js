import { v4 as uuidv4 } from 'uuid';
import PlotDetails from '../models/PlotDetails.js';
import Plot from '../models/Plot.js';
import PaymentInstallment from '../models/PaymentInstallment.js';
import PaymentSchedule from '../models/PaymentSchedule.js';

export const calculatePaymentProgress = async (plotId) => {
  const plot = await Plot.findById(plotId);
  if (!plot) return { percentage: 0, totalPaid: 0, totalValue: 0 };

  const totalValue = parseFloat(plot.totalValue?.toString() || '0');
  if (totalValue === 0) return { percentage: 0, totalPaid: 0, totalValue: 0 };

  const schedules = await PaymentSchedule.find({ plotId });
  const scheduleIds = schedules.map(s => s._id);
  
  const installments = await PaymentInstallment.find({ 
    paymentScheduleId: { $in: scheduleIds },
    status: { $in: ['paid', 'partial'] }
  });

  const totalPaid = installments.reduce((sum, inst) => {
    return sum + parseFloat(inst.amountPaid?.toString() || '0');
  }, 0);

  const percentage = (totalPaid / totalValue) * 100;

  return { percentage, totalPaid, totalValue };
};

export const checkAndIssueMilestoneDocuments = async (plotId) => {
  const { percentage } = await calculatePaymentProgress(plotId);
  const plotDetails = await PlotDetails.findOne({ plotId });
  
  if (!plotDetails) return { milestone: null, documentIssued: false };

  const milestones = [];

  if (percentage >= 10 && !plotDetails.allotmentDocUri) {
    plotDetails.allotmentDocUri = `/documents/allotment/${uuidv4()}.pdf`;
    milestones.push({ type: 'allotment', percentage: 10, docUri: plotDetails.allotmentDocUri });
  }

  if (percentage >= 50 && !plotDetails.allocationDocUri) {
    plotDetails.allocationDocUri = `/documents/allocation/${uuidv4()}.pdf`;
    milestones.push({ type: 'allocation', percentage: 50, docUri: plotDetails.allocationDocUri });
  }

  if (percentage >= 75 && !plotDetails.possessionDocUri) {
    plotDetails.possessionDocUri = `/documents/possession/${uuidv4()}.pdf`;
    milestones.push({ type: 'possession', percentage: 75, docUri: plotDetails.possessionDocUri });
  }

  if (percentage >= 100 && !plotDetails.clearanceDocUri) {
    plotDetails.clearanceDocUri = `/documents/clearance/${uuidv4()}.pdf`;
    milestones.push({ type: 'clearance', percentage: 100, docUri: plotDetails.clearanceDocUri });
    
    const plot = await Plot.findById(plotId);
    if (plot) {
      plot.status = 'sold';
      await plot.save();
    }
  }

  if (milestones.length > 0) {
    await plotDetails.save();
  }

  return { 
    currentPercentage: percentage,
    milestonesReached: milestones,
    documentIssued: milestones.length > 0 
  };
};

export const getRequiredDocuments = () => {
  return [
    { name: 'plotMap', description: 'Plot Map (Nakshah)', required: true },
    { name: 'cnicCopy', description: 'Purchaser CNIC Copy', required: true },
    { name: 'bankStatement', description: 'Purchaser Bank Statement', required: true },
    { name: 'companyForm', description: 'Company Form', required: true }
  ];
};
