export function getAttendanceSummaryMetrics(records = []) {
  const normalizedRecords = (records || []).filter((record) => {
    const studentIdNumber = String(record?.studentIdNumber ?? '').trim();
    return studentIdNumber && studentIdNumber !== 'N/A';
  });

  const uniqueStudentIds = new Set(
    normalizedRecords.map((record) => String(record.studentIdNumber).trim())
  );

  return {
    totalStudentVisits: normalizedRecords.length,
    uniqueStudentCount: uniqueStudentIds.size,
  };
}
