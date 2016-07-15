<?php

namespace App\Helpers;


class TreeRender
{
    public function pages($tree)
    {
        if (!empty($tree)) {
            ?>
            <div class="js-tree-icons-alt treeview">
            <ul class="list-group"><?php

            foreach ($tree as $page) {
                ?>
                <li class="list-group-item node-"><a href="<?= route('edit_page', $page->id) ?>"><?= $page->title_in_menu ?></a><?php
                $this->pages($page['children']);
                ?></li><?php
            }
            ?></ul></div><?php
        }
    }

    public function menus()
    {

    }
}