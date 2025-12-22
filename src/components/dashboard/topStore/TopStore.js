import TableWrapper from '../../../utils/hoc/TableWrapper'
import ShowTable from '../../table/ShowTable';

const TopStore = ({ data, ...props }) => {
    // Handle both array and pagination object structures
    let dataArray = [];
    if (Array.isArray(data)) {
        dataArray = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
        // If data is a pagination object with data.data array
        dataArray = data.data;
    }
    
    const headerObj = {
        checkBox: false,
        isOption: false,
        isSerialNo:false,
        noEdit: false,
        isSerialNo: false,
        column: [
            { title: "VendorName", apiKey: "store_name" },
            { title: "Orders", apiKey: "orders_count" },
            { title: "Earning", apiKey: "order_amount" },
        ],
        data: dataArray.slice(0, 6)
    };
    return (
        <>
            <ShowTable {...props} headerData={headerObj} />
        </>
    )
}

export default TableWrapper(TopStore)