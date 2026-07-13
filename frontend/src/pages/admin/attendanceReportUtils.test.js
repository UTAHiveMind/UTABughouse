import { getAttendanceSummaryMetrics } from './attendanceReportUtils';

describe('getAttendanceSummaryMetrics', () => {
  it('counts total visits and unique students by student ID across sessions and walk-ins', () => {
    const records = [
      { studentIdNumber: '1001023127', type: 'Session' },
      { studentIdNumber: '1001023127', type: 'Session' },
      { studentIdNumber: '1001023127', type: 'Walk-In' },
      { studentIdNumber: '1001023127', type: 'Session' },
      { studentIdNumber: '1001023131', type: 'Session' },
      { studentIdNumber: 'N/A', type: 'Walk-In' },
      { studentIdNumber: '', type: 'Session' },
    ];

    expect(getAttendanceSummaryMetrics(records)).toEqual({
      totalStudentVisits: 5,
      uniqueStudentCount: 2,
    });
  });
});
