import React, { Fragment } from "react";
import { Tab } from '@headlessui/react';

import CreationPanel from "../../organisms/creationPanel";
import QueueDisplay from "../../organisms/queueDisplay";

import ProcessingStatus from "../../molecules/queueStatusTab";

import {
  tabStyles,
} from "../../_recipes/tabs_headless.css";

import {
  TabpanelScrollFlop
} from "./creationTabs.css";

export default function CreationTabs() {

  return (
    <Tab.Group>
      <Tab.List>
        <Tab as={Fragment}>
          {({ selected }) => (
            <button
              className={tabStyles({
                selected,
              })}
            >
              Create
            </button>
          )}
        </Tab>

        <Tab as={Fragment}>
          {({ selected }) => (

            <button
              className={tabStyles({
                selected,
              })}
            >
              <ProcessingStatus></ProcessingStatus>
            </button>
          )}
        </Tab>


      </Tab.List>
      <Tab.Panels className={TabpanelScrollFlop}>
        <Tab.Panel>
          <CreationPanel></CreationPanel>
        </Tab.Panel>
        <Tab.Panel>
          <QueueDisplay></QueueDisplay>
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
}
