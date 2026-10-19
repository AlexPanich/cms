<?php
/**
 * Created by PhpStorm.
 * User: User
 * Date: 019 19.05.16
 * Time: 11:24
 */

namespace App\Pagination;


use Illuminate\Contracts\Pagination\Presenter as PresenterContract;
use Illuminate\Contracts\Pagination\Paginator as PaginatorContract;
use Illuminate\Pagination\UrlWindow;
use Illuminate\Support\HtmlString;
use Illuminate\Pagination\BootstrapThreeNextPreviousButtonRendererTrait;
use Illuminate\Pagination\UrlWindowPresenterTrait;


class DashboardArticlePresenter implements PresenterContract
{
    use BootstrapThreeNextPreviousButtonRendererTrait, UrlWindowPresenterTrait;

    protected $paginater;

    protected $window;

    public function __construct(PaginatorContract $paginator, UrlWindow $window = null)
    {
        $this->paginator = $paginator;
        $this->window = is_null($window) ? UrlWindow::make($paginator, 2) : $window->get();
    }

    public function hasPages()
    {
        return $this->paginator->hasPages();
    }

    public function render()
    {
        if ($this->hasPages()) {
            return new HtmlString(sprintf(
                '<ul class="pagination">%s %s %s</ul>',
                $this->getPreviousButton('Предыдущая'),
                $this->getLinks(),
                $this->getNextButton('Следующая')
            ));
        }

        return '';
    }

    protected function getDisabledTextWrapper($text)
    {
        return '<li class="disabled"><span>'.$text.'</span></li>';
    }

    protected function getActivePageWrapper($text)
    {
        return '<li class="active"><span>'.$text.'</span></li>';
    }

    protected function getAvailablePageWrapper($url, $page, $rel = null)
    {
        $rel = is_null($rel) ? '' : ' rel="'.$rel.'"';

        return '<li><a href="'.htmlentities($url).'"'.$rel.'>'.$page.'</a></li>';
    }

    protected function getDots()
    {
        return $this->getDisabledTextWrapper('...');
    }
}