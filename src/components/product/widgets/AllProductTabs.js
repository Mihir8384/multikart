
import { Col, TabContent, TabPane } from "reactstrap";
import { generateTitleList } from "./TitleList";
import { useEffect } from "react";

// We will update these existing components later
import GeneralTab from "../GeneralTab";
import SetupTab from "../SetupTab";
import SeoTab from "../SeoTab";

// These are NEW components we will create in the next steps
import ContentPoliciesTab from "../ContentPoliciesTab";
import MediaTab from "../MediaTab";
import TaxonomyTab from "../TaxonomyTab";

// REMOVED old components:
// - DigitalTab
// - InventoryTab
// - OptionsTab
// - ProductImageTab
// - VariationsTab

const AllProductTabs = ({
  setErrors,
  setTouched,
  values,
  setFieldValue,
  errors,
  updateId,
  activeTab,
  isSubmitting,
  setActiveTab,
  touched,
}) => {
  // This logic is good, it automatically switches to a tab with an error on submit.
  useEffect(() => {
    let productTabs = generateTitleList(values)
      .map((main) =>
        main.inputs.filter((item) => errors[item] && touched[item])
      )
      .findIndex(
        (innerArray) =>
          Array.isArray(innerArray) &&
          innerArray.some((item) => typeof item == "string")
      );

    if (productTabs !== -1 && activeTab !== productTabs + 1) {
      setActiveTab(String(productTabs + 1));
    }
  }, [isSubmitting]);

  return (
    <Col xl="7" lg="8">
      {/* All conditional logic for 'product_type' is REMOVED.
        We now have a single, unified tab structure for the Master Product.
      */}
      <TabContent activeTab={activeTab}>
        {/* Tab 1: General */}
        <TabPane tabId="1" className="some">
          <GeneralTab
            values={values}
            setFieldValue={setFieldValue}
            updateId={updateId}
          />
        </TabPane>

        {/* Tab 2: Content & Policies (New) */}
        <TabPane tabId="2">
          <ContentPoliciesTab values={values} setFieldValue={setFieldValue} />
        </TabPane>

        {/* Tab 3: Media (New) */}
        <TabPane tabId="3">
          <MediaTab
            values={values}
            setFieldValue={setFieldValue}
            errors={errors}
            updateId={updateId}
          />
        </TabPane>

        {/* Tab 4: Taxonomy (New) */}
        <TabPane tabId="4">
          <TaxonomyTab
            values={values}
            setFieldValue={setFieldValue}
            errors={errors}
          />
        </TabPane>

        {/* Tab 5: Related Products (was SetupTab) */}
        <TabPane tabId="5">
          <SetupTab
            values={values}
            setFieldValue={setFieldValue}
            errors={errors}
            updateId={updateId}
          />
        </TabPane>

        {/* Tab 6: SEO */}
        <TabPane tabId="6">
          <SeoTab
            values={values}
            setFieldValue={setFieldValue}
            updateId={updateId}
          />
        </TabPane>
      </TabContent>
    </Col>
  );
};

export default AllProductTabs;
