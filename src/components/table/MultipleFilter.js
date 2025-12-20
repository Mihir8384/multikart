import AccountContext from "@/helper/accountContext";
import SettingContext from "@/helper/settingContext";
import { useContext } from "react";
import { Col, Row } from "reactstrap";

const MultipleFilter = ({ showAdvanceFilter, advanceFilter }) => {
  const { accountData } = useContext(AccountContext);
  const { settingObj } = useContext(SettingContext);
  
  // If no advanceFilter provided at all, return null
  if (!advanceFilter || Object.keys(advanceFilter).length === 0) {
    return null;
  }
  
  // Get all filter keys dynamically
  const filterKeys = Object.keys(advanceFilter);
  
  // Check for specific filters for conditional rendering
  const hasStoreIds = advanceFilter?.store_ids && accountData?.role?.name !== "vendor" && settingObj?.activation?.multivendor;
  
  return (
    <>
      <div className="show-box mb-4 d-block product-category-option filter-option-list">
        <Row className="gy-3">
          {filterKeys.map((filterKey) => {
            // Skip store_ids if user is vendor or multivendor is disabled
            if (filterKey === 'store_ids' && !hasStoreIds) {
              return null;
            }
            
            // Render each filter
            return (
              <Col key={filterKey} xl={3} sm={6}>
                {advanceFilter[filterKey]}
              </Col>
            );
          })}
        </Row>
      </div>
    </>
  );
};

export default MultipleFilter;
