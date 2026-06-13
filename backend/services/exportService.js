/**
 * Formats results data into CSV string
 * @param {Array} results - List of results with populated student data
 * @returns {string} CSV content
 */
exports.generateResultsCSV = (results) => {
    if (!results || results.length === 0) return '';

    // 1. Determine all unique subject names across all results to create columns
    const subjectNames = new Set();
    results.forEach(r => {
        r.subjects.forEach(s => subjectNames.add(s.name));
    });
    const subjectHeaders = Array.from(subjectNames).sort();

    // 2. Create Header Row
    const headers = ['Admission Number', 'Student Name', ...subjectHeaders, 'Total', 'Grade'];
    const rows = [headers.join(',')];

    // 3. Create Data Rows
    results.forEach(r => {
        const studentName = `${r.studentId?.firstName || 'Unknown'} ${r.studentId?.lastName || ''}`.trim();
        const admissionNumber = r.studentId?.admissionNumber || 'N/A';
        
        const rowData = [
            admissionNumber,
            `"${studentName}"`, // Quote names to handle commas
        ];

        // Add scores for each subject column
        subjectHeaders.forEach(header => {
            const sub = r.subjects.find(s => s.name === header);
            rowData.push(sub ? sub.score : '-');
        });

        rowData.push(r.total || 0);
        rowData.push(r.grade || 'F');

        rows.push(rowData.join(','));
    });

    return rows.join('\n');
};
